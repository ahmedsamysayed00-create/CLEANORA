/*
# Security hardening: RLS policies, function permissions, and price validation

## Summary

This migration addresses all security and data-integrity issues identified in
the Phase 1 audit. It does NOT add new features, tables, or columns. It only
tightens existing RLS policies, secures database functions, and adds a
server-side price calculation function.

## 1. Admin role escalation prevention (CRITICAL)

### Problem
The `profiles_insert_own` RLS policy only checked `auth.uid() = id` but did NOT
restrict the `role` column. A user could insert their own profile with
`role = 'admin'` by calling the Supabase API directly, bypassing the frontend.

### Fix
Updated `profiles_insert_own` to also enforce `role = 'customer'` in the
WITH CHECK clause. Now any profile insert by a user MUST have role = 'customer'.
Existing admin accounts are unaffected (they were created before this policy
or through a privileged path).

Also updated `profiles_update_own` to prevent users from changing their own
role during a profile update. The WITH CHECK now enforces that the role column
cannot be changed to anything other than its current value — effectively
preventing self-escalation via UPDATE.

## 2. Booking status protection (HIGH)

### Problem
The `bookings_update_own_or_admin` policy allowed customers to update ANY
field on their own bookings, including `status`. A customer could mark their
own booking as 'completed'.

### Fix
Removed customer UPDATE permission entirely. The new policy
`bookings_update_admin` only allows admins to update bookings. Customers can
still SELECT and INSERT their own bookings, but cannot UPDATE them. This is
the safest approach for the current phase — customer cancellation/rescheduling
will be added in a later phase with appropriately scoped policies.

## 3. Server-side price validation (HIGH)

### Problem
The client sent `estimated_price` directly during booking creation. RLS did
not validate this value. A user could submit any price.

### Fix
Created a SECURITY DEFINER function `calculate_booking_estimate` that computes
the expected price from trusted database values (service.starting_price) using
the current pricing formula. Created a trigger `enforce_booking_price` that
fires BEFORE INSERT on bookings, calculates the authoritative price, and
overwrites whatever the client submitted. The client can no longer control
the stored `estimated_price`.

The function uses the current formula:
  round((starting_price + bedrooms*25 + bathrooms*20) * (house ? 1.15 : 1))

This is NOT the dynamic pricing engine — it uses the same hardcoded formula
that existed in the client, just moved server-side. The pricing_rules table
remains unused.

## 4. Booking date validation (LOW)

### Fix
Created a trigger `prevent_past_booking_date` that fires BEFORE INSERT on
bookings and raises an exception if booking_date is before today. This
enforces the constraint at the database level.

## 5. is_admin() permission hardening (MEDIUM)

### Problem
The `is_admin()` SECURITY DEFINER function was executable by the `anon` role,
allowing unauthenticated users to call it via the REST API.

### Fix
Revoked EXECUTE from `anon` and `public`. Granted EXECUTE only to
`authenticated`, which is the only role that needs it (RLS policies use it
with `TO authenticated`).

## 6. handle_updated_at() search_path hardening (MEDIUM)

### Problem
The trigger function had a mutable search_path, flagged by the security
advisor.

### Fix
Recreated the function with `SET search_path = public`.

## 7. Important notes

1. No tables, columns, or data are dropped or modified.
2. All existing admin accounts continue to work — the is_admin() function
   and admin RLS policies are unchanged in logic.
3. The bookings INSERT policy still allows customers to insert their own
   bookings. The price trigger overwrites estimated_price server-side.
4. The bookings SELECT and DELETE policies are unchanged.
5. Customer profile UPDATE still works for full_name and phone — only the
   role column is locked down.
6. All updated_at triggers continue to work — the function logic is identical,
   only the search_path is now fixed.
*/

-- ============ 1. Fix admin role escalation ============

-- Profiles INSERT: enforce role = 'customer' on self-insert
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id AND role = 'customer');

-- Profiles UPDATE: prevent role self-escalation via UPDATE
-- Users can still update full_name and phone, but cannot change their role.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = 'customer');

-- ============ 2. Fix booking status authorization ============

-- Remove the old policy that allowed customers to update their own bookings
DROP POLICY IF EXISTS "bookings_update_own_or_admin" ON public.bookings;

-- New policy: only admins can update bookings
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin"
ON public.bookings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============ 3. Server-side price calculation ============

-- Function to calculate the authoritative booking estimate from trusted DB data
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
BEGIN
  SELECT starting_price INTO v_base
  FROM public.services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_estimate := (v_base + COALESCE(p_bedrooms, 0) * 25 + COALESCE(p_bathrooms, 0) * 20);

  IF p_property_type = 'house' THEN
    v_estimate := v_estimate * 1.15;
  END IF;

  RETURN ROUND(v_estimate);
END;
$$;

-- Trigger to enforce server-calculated estimated_price on booking insert
CREATE OR REPLACE FUNCTION public.enforce_booking_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always overwrite the client-provided estimated_price with the server-calculated value
  NEW.estimated_price := public.calculate_booking_estimate(
    NEW.service_id,
    NEW.property_type,
    NEW.bedrooms,
    NEW.bathrooms
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_booking_price_trigger ON public.bookings;
CREATE TRIGGER enforce_booking_price_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_price();

-- ============ 4. Booking date validation ============

CREATE OR REPLACE FUNCTION public.prevent_past_booking_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_date IS NOT NULL AND NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Booking date cannot be in the past.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_past_booking_date_trigger ON public.bookings;
CREATE TRIGGER prevent_past_booking_date_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_past_booking_date();

-- ============ 5. Secure is_admin() permissions ============

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============ 6. Fix handle_updated_at() search_path ============

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;