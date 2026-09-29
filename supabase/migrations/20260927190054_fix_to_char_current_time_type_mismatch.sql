/*
# Fix: to_char(CURRENT_TIME) type mismatch in get_available_slots and prevent_past_booking_date

## Issue
Both `get_available_slots(date)` and `prevent_past_booking_date()` use:

    v_current_time := to_char(CURRENT_TIME, 'HH24:MI');

`CURRENT_TIME` returns `time with time zone`, but `to_char` does not have an
overload for that type. This causes a runtime error when either function
executes:

    ERROR: function to_char(time with time zone, unknown) does not exist

This means:
1. `get_available_slots` fails when called — the availability API is broken.
2. `prevent_past_booking_date` fails when a same-day booking is inserted —
   the INSERT fails with the to_char error instead of the intended
   past-time validation error.

## Fix
Cast `CURRENT_TIME` to `time` (without time zone) before passing to
`to_char`:

    v_current_time := to_char(CURRENT_TIME::time, 'HH24:MI');

This produces the correct 'HH24:MI' string for comparison against booking_time
(which is stored as text).

## Timezone semantics
The database timezone is UTC. CURRENT_TIME::time extracts the time portion
in the server's timezone (UTC). Booking times are stored as text in local
business time format ('09:00' through '17:00'). The comparison
`booking_time <= v_current_time` uses string comparison on 'HH24:MI' format,
which is lexicographically correct for same-day ordering.

For this portfolio project, the business operates in UTC and all booking
times are interpreted as UTC. This is consistent with the existing date-only
storage model (DATE type, no timezone conversion).

No schema changes. No other functions affected.
*/

-- Fix get_available_slots
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
  IF p_target_date IS NULL THEN
    RAISE EXCEPTION 'Date is required.';
  END IF;

  v_current_time := to_char(CURRENT_TIME::time, 'HH24:MI');

  FOREACH v_slot IN ARRAY ARRAY['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'] LOOP
    v_available := true;

    IF p_target_date = v_today AND v_slot <= v_current_time THEN
      v_available := false;
    END IF;

    IF p_target_date < v_today THEN
      v_available := false;
    END IF;

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

-- Fix prevent_past_booking_date
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

  IF NEW.booking_date = CURRENT_DATE AND NEW.booking_time IS NOT NULL THEN
    v_current_time := to_char(CURRENT_TIME::time, 'HH24:MI');
    IF NEW.booking_time <= v_current_time THEN
      RAISE EXCEPTION 'This time slot has already passed. Please choose a later time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-apply permissions (CREATE OR REPLACE may reset them)
GRANT EXECUTE ON FUNCTION public.get_available_slots(date) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(date) FROM public;

-- Trigger functions: revoke from all roles
REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM public;
