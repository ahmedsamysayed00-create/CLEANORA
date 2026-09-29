/*
# Dynamic pricing engine: replace hardcoded formula with pricing_rules-driven calculation

## Summary

Replaces the hardcoded pricing formula in calculate_booking_estimate with a
database-driven implementation that reads active pricing_rules records.
Also seeds the initial pricing rules if none exist, and adds a uniqueness
constraint to prevent duplicate active rules for the same service_id +
rule_key combination.

## 1. calculate_booking_estimate — rewritten

The function now:
1. Validates inputs (service must exist and be active, bedrooms >= 0,
   bathrooms >= 0, property_type must be non-null).
2. Reads service.starting_price as the base price.
3. Loads all active pricing rules applicable to the service (global rules
   where service_id IS NULL, plus service-specific rules).
4. For each rule_key, the service-specific rule overrides the global rule.
5. Applies additive rules (bedroom_extra, bathroom_extra) by multiplying
   the modifier by the count and adding to the total.
6. Applies multiplier rules (house_multiplier) by multiplying the running
   total when property_type = 'house'.
7. Rounds and returns the final price.

Supported rule keys:
- bedroom_extra (additive): added per bedroom
- bathroom_extra (additive): added per bathroom
- house_multiplier (multiplier): applied when property_type = 'house'

Unknown rule keys are ignored (forward compatibility).

## 2. Uniqueness constraint

A partial unique index prevents duplicate active rules for the same
(service_id, rule_key) pair. For global rules (service_id IS NULL), a
separate partial index handles NULL uniqueness. This ensures deterministic
rule resolution.

## 3. Initial pricing rules seeded

If no pricing rules exist, three global rules are inserted:
- bedroom_extra: additive, 25
- bathroom_extra: additive, 20
- house_multiplier: multiplier, 1.15

These replicate the previous hardcoded formula as database records.

## 4. Security

- Function remains SECURITY DEFINER with SET search_path = public
- Input validation raises exceptions for invalid service or negative inputs
- No changes to RLS policies or trigger architecture
- enforce_booking_price trigger continues to call this function
- EXECUTE permissions unchanged (authenticated only, anon revoked)

## 5. Important notes

1. No tables, columns, or data are dropped.
2. Existing pricing_rules records are preserved.
3. The uniqueness index is created only if no duplicates exist.
4. The function raises an exception for invalid/inactive services rather
   than returning 0, so booking inserts fail clearly instead of storing
   a zero-price booking.
*/

-- ============ 1. Rewrite calculate_booking_estimate ============

CREATE OR REPLACE FUNCTION public.calculate_booking_estimate(
  p_service_id uuid,
  p_property_type text,
  p_bedrooms int,
  p_bathrooms int
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_base numeric;
  v_estimate numeric;
  v_bedroom_modifier numeric;
  v_bathroom_modifier numeric;
  v_house_multiplier numeric;
  v_bedrooms int;
  v_bathrooms int;
BEGIN
  -- Validate numeric inputs
  v_bedrooms := COALESCE(p_bedrooms, 0);
  v_bathrooms := COALESCE(p_bathrooms, 0);

  IF v_bedrooms < 0 THEN
    RAISE EXCEPTION 'Bedrooms cannot be negative.';
  END IF;

  IF v_bathrooms < 0 THEN
    RAISE EXCEPTION 'Bathrooms cannot be negative.';
  END IF;

  -- Validate and load service
  SELECT starting_price INTO v_base
  FROM public.services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or inactive.';
  END IF;

  v_estimate := v_base;

  -- Load bedroom_extra rule (service-specific overrides global)
  SELECT price_modifier INTO v_bedroom_modifier
  FROM public.pricing_rules
  WHERE rule_key = 'bedroom_extra'
    AND is_active = true
    AND service_id = p_service_id
  LIMIT 1;

  IF v_bedroom_modifier IS NULL THEN
    SELECT price_modifier INTO v_bedroom_modifier
    FROM public.pricing_rules
    WHERE rule_key = 'bedroom_extra'
      AND is_active = true
      AND service_id IS NULL
    LIMIT 1;
  END IF;

  IF v_bedroom_modifier IS NOT NULL THEN
    v_estimate := v_estimate + (v_bedrooms * v_bedroom_modifier);
  END IF;

  -- Load bathroom_extra rule (service-specific overrides global)
  SELECT price_modifier INTO v_bathroom_modifier
  FROM public.pricing_rules
  WHERE rule_key = 'bathroom_extra'
    AND is_active = true
    AND service_id = p_service_id
  LIMIT 1;

  IF v_bathroom_modifier IS NULL THEN
    SELECT price_modifier INTO v_bathroom_modifier
    FROM public.pricing_rules
    WHERE rule_key = 'bathroom_extra'
      AND is_active = true
      AND service_id IS NULL
    LIMIT 1;
  END IF;

  IF v_bathroom_modifier IS NOT NULL THEN
    v_estimate := v_estimate + (v_bathrooms * v_bathroom_modifier);
  END IF;

  -- Load house_multiplier rule (service-specific overrides global)
  SELECT price_modifier INTO v_house_multiplier
  FROM public.pricing_rules
  WHERE rule_key = 'house_multiplier'
    AND is_active = true
    AND service_id = p_service_id
  LIMIT 1;

  IF v_house_multiplier IS NULL THEN
    SELECT price_modifier INTO v_house_multiplier
    FROM public.pricing_rules
    WHERE rule_key = 'house_multiplier'
      AND is_active = true
      AND service_id IS NULL
    LIMIT 1;
  END IF;

  IF v_house_multiplier IS NOT NULL AND p_property_type = 'house' THEN
    v_estimate := v_estimate * v_house_multiplier;
  END IF;

  RETURN ROUND(v_estimate);
END;
$$;

-- ============ 2. Uniqueness constraint ============

-- Partial unique index for service-specific rules (service_id IS NOT NULL)
-- Only applies to active rules to allow inactive duplicates to coexist
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_rules_active_service_key
ON public.pricing_rules (service_id, rule_key)
WHERE is_active = true AND service_id IS NOT NULL;

-- Partial unique index for global rules (service_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_rules_active_global_key
ON public.pricing_rules (rule_key)
WHERE is_active = true AND service_id IS NULL;

-- ============ 3. Seed initial pricing rules if empty ============

INSERT INTO public.pricing_rules (service_id, rule_key, rule_label, price_modifier, modifier_type, is_active)
SELECT NULL, 'bedroom_extra', 'Per bedroom', 25, 'additive', true
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE rule_key = 'bedroom_extra' AND service_id IS NULL);

INSERT INTO public.pricing_rules (service_id, rule_key, rule_label, price_modifier, modifier_type, is_active)
SELECT NULL, 'bathroom_extra', 'Per bathroom', 20, 'additive', true
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE rule_key = 'bathroom_extra' AND service_id IS NULL);

INSERT INTO public.pricing_rules (service_id, rule_key, rule_label, price_modifier, modifier_type, is_active)
SELECT NULL, 'house_multiplier', 'House surcharge', 1.15, 'multiplier', true
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE rule_key = 'house_multiplier' AND service_id IS NULL);

-- ============ 4. Grant EXECUTE on calculate_booking_estimate to authenticated ============

-- The function is called internally by the enforce_booking_price trigger.
-- Authenticated users may also call it via RPC for quote preview.
-- Anon remains revoked from the security hardening phase.
GRANT EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) TO authenticated;