/*
# Availability & Scheduling: operating hours, past-date/time validation, double-booking prevention

## Summary

This migration implements server-side scheduling integrity for Phase 5. It
enhances the existing past-date validation to also check booking time, adds
operating-hours validation (09:00–17:00 start slots), creates a unique partial
index to prevent duplicate active bookings on the same date+time slot, and adds
a `get_available_slots` function that returns available time slots for a given
date without exposing private booking information.

No existing tables, columns, or data are modified or dropped. The existing
booking lifecycle, pricing trigger, and RLS policies remain intact.

## 1. Enhanced past date/time validation

The existing `prevent_past_booking_date` trigger only checked if
`booking_date < CURRENT_DATE`. This meant same-day bookings at past times
(e.g. booking 09:00 when it's already 15:00) were accepted.

The trigger now also rejects same-day bookings where the booking time has
already passed. It compares against the server's current time (not the
client's clock). Time is interpreted as local business time (no timezone
conversion) to match the existing date-only storage model.

## 2. Operating hours validation

A new trigger `enforce_operating_hours` rejects bookings outside the
09:00–17:00 service window. The allowed start times are:
  09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00

Times outside this range (e.g. 08:00, 18:00) are rejected.

## 3. Double-booking prevention

A partial unique index on `bookings(booking_date, booking_time)` where the
booking is in an active status (pending, confirmed, in_progress) prevents two
customers from occupying the same slot. Cancelled and completed bookings are
excluded, so cancelled slots become available again and completed historical
bookings don't block future scheduling.

This is enforced atomically by PostgreSQL's unique constraint — no
application-level check is needed. Two simultaneous INSERTs for the same
date+time will cause one to fail with a unique violation.

## 4. get_available_slots function

Returns a JSON array of available time slots for a given date. Each slot is
represented as `{ "time": "09:00", "available": true/false }`. The function:
- Requires authentication (EXECUTE granted to authenticated only)
- Validates the date is not null
- Checks each of the 9 standard time slots
- A slot is unavailable if an active booking (pending/confirmed/in_progress)
  exists for that date+time
- Does NOT return any customer names, booking IDs, prices, or other private data
- SECURITY DEFINER with search_path = public so it can read bookings without
  being blocked by RLS (which would prevent cross-customer visibility)

## 5. Permissions

- get_available_slots: EXECUTE granted to authenticated, revoked from anon/public
- Trigger functions: EXECUTE revoked from all roles (internal only)

## 6. Important notes

1. The existing enforce_booking_price trigger and calculate_booking_estimate
   function are untouched. Historical prices remain immutable.
2. The existing booking lifecycle triggers (status transitions, history) are
   untouched.
3. The unique index uses WHERE status IN ('pending','confirmed','in_progress')
   so cancelled/completed bookings free their slots.
4. Date/time are stored as local business values (date type + text time), no
   timezone conversion is applied. The server's CURRENT_DATE and CURRENT_TIME
   are used for validation.
*/

-- ============ 1. Enhanced past date/time validation ============

CREATE OR REPLACE FUNCTION public.prevent_past_booking_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_time text;
BEGIN
  IF NEW.booking_date IS NOT NULL AND NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Booking date cannot be in the past.';
  END IF;

  -- Same-day booking: check if the time slot has already passed
  IF NEW.booking_date = CURRENT_DATE AND NEW.booking_time IS NOT NULL THEN
    v_current_time := to_char(CURRENT_TIME, 'HH24:MI');
    IF NEW.booking_time <= v_current_time THEN
      RAISE EXCEPTION 'This time slot has already passed. Please choose a later time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============ 2. Operating hours validation ============

CREATE OR REPLACE FUNCTION public.enforce_operating_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_time IS NOT NULL THEN
    IF NEW.booking_time NOT IN ('09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00') THEN
      RAISE EXCEPTION 'Booking time must be between 09:00 and 17:00.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_operating_hours_trigger ON public.bookings;
CREATE TRIGGER enforce_operating_hours_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_operating_hours();

-- ============ 3. Double-booking prevention (partial unique index) ============

-- This index prevents two active bookings from occupying the same date+time slot.
-- Cancelled and completed bookings are excluded, freeing their slots.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_active_slot
ON public.bookings (booking_date, booking_time)
WHERE status IN ('pending', 'confirmed', 'in_progress');

-- ============ 4. get_available_slots function ============

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_target_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_slots json[] := ARRAY[]::json[];
  v_slot text;
  v_available boolean;
  v_today date := CURRENT_DATE;
  v_current_time text;
  v_result json;
BEGIN
  -- Validate date is not null
  IF p_target_date IS NULL THEN
    RAISE EXCEPTION 'Date is required.';
  END IF;

  -- Get current server time for same-day checks
  v_current_time := to_char(CURRENT_TIME, 'HH24:MI');

  -- Check each standard time slot
  FOREACH v_slot IN ARRAY ARRAY['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'] LOOP
    -- Default: available
    v_available := true;

    -- Same-day past time slots are unavailable
    IF p_target_date = v_today AND v_slot <= v_current_time THEN
      v_available := false;
    END IF;

    -- Past dates are all unavailable
    IF p_target_date < v_today THEN
      v_available := false;
    END IF;

    -- Check if an active booking occupies this slot
    IF v_available THEN
      SELECT EXISTS(
        SELECT 1 FROM public.bookings
        WHERE booking_date = p_target_date
          AND booking_time = v_slot
          AND status IN ('pending', 'confirmed', 'in_progress')
      ) INTO v_available;
      v_available := NOT v_available;
    END IF;

    v_slots := array_append(v_slots, json_build_object('time', v_slot, 'available', v_available));
  END LOOP;

  v_result := json_agg(elem) FROM unnest(v_slots) AS elem;
  RETURN v_result;
END;
$$;

-- ============ 5. Permissions ============

GRANT EXECUTE ON FUNCTION public.get_available_slots(date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(date) FROM public;

-- Revoke EXECUTE on trigger functions from all roles
REVOKE EXECUTE ON FUNCTION public.enforce_operating_hours() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_operating_hours() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_operating_hours() FROM public;
