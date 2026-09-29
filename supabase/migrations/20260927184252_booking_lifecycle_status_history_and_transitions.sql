/*
# Booking Lifecycle: Status History, Transition Enforcement, and Secure Status Functions

## Summary

This migration implements the complete booking lifecycle infrastructure at the
database level. It adds a `booking_status_history` audit table, a secure
`update_booking_status` RPC for admin status transitions, a secure
`cancel_own_booking` RPC for customer cancellations, a trigger that enforces
valid state transitions and automatically records history, and RLS policies
protecting the history table.

No existing tables, columns, or data are modified or dropped. The existing
bookings schema, pricing trigger, and RLS policies remain intact.

## 1. New Tables

### booking_status_history
- `id` (uuid, primary key)
- `booking_id` (uuid, not null, references bookings ON DELETE CASCADE)
- `old_status` (text, nullable — null for initial creation)
- `new_status` (text, not null)
- `changed_by` (uuid, not null, references profiles ON DELETE SET NULL)
- `created_at` (timestamptz, default now())

Records every booking status transition. Append-only: no UPDATE or DELETE
through RLS. Old status is NULL for the initial "pending" entry recorded when
a booking is created.

## 2. New Functions

### update_booking_status(p_booking_id uuid, p_new_status text)
- SECURITY DEFINER, search_path = public
- Admin-only: verifies caller is admin via is_admin()
- Validates booking exists
- Validates current → new status is a permitted transition
- Atomically updates booking.status
- Inserts a booking_status_history row
- Returns the new status text
- Raises exception on invalid transition, unauthorized access, or missing booking

### cancel_own_booking(p_booking_id uuid)
- SECURITY DEFINER, search_path = public
- Customer-facing: verifies booking belongs to auth.uid()
- Validates booking is in 'pending' or 'confirmed' status
- Atomically updates booking.status to 'cancelled'
- Inserts a booking_status_history row
- Returns the new status ('cancelled')
- Raises exception if booking belongs to another user, is not cancellable, or doesn't exist

### record_booking_creation()
- Trigger function: fires AFTER INSERT on bookings
- Records the initial 'pending' status in booking_status_history
- changed_by is set to the booking's customer_id

### enforce_booking_status_transition()
- Trigger function: fires BEFORE UPDATE on bookings
- Only enforces when status column is changed (other field updates are allowed)
- Validates old → new transition against the allowed transition map
- Raises exception on invalid transitions (e.g. pending → completed, completed → anything)

## 3. Transition Matrix

```
pending → confirmed, cancelled
confirmed → in_progress, cancelled
in_progress → completed
completed → (terminal, no transitions)
cancelled → (terminal, no transitions)
```

Invalid jumps like pending → completed, pending → in_progress, completed → pending,
cancelled → confirmed are rejected at the database level.

## 4. RLS Policies

### booking_status_history
- SELECT: customers can read history for their own bookings; admins can read all
- INSERT: none for authenticated users (only the database functions/trigger insert)
- UPDATE: none
- DELETE: none

This makes the table effectively append-only from the client's perspective.
History rows are created exclusively by the trigger and the secure RPC functions.

## 5. Permissions

- update_booking_status: EXECUTE granted to authenticated only
- cancel_own_booking: EXECUTE granted to authenticated only
- Trigger functions: EXECUTE revoked from all roles (internal only)
- booking_status_history: table privileges granted to authenticated (SELECT only)

## 6. Important Notes

1. The existing bookings UPDATE policy (`bookings_update_admin`) already
   restricts UPDATE to admins only. The new trigger adds an additional layer
   of protection by validating transitions at the database level, so even an
   admin cannot make an invalid transition (e.g. pending → completed).
2. Customer cancellation goes through the cancel_own_booking RPC, which is
   SECURITY DEFINER and bypasses RLS to update the booking status. This is
   safe because the function validates ownership internally.
3. The enforce_booking_status_transition trigger only fires when the status
   column actually changes. Admins can still update other booking fields
   without triggering status validation.
4. Historical price integrity: the enforce_booking_price trigger only fires
   BEFORE INSERT, never BEFORE UPDATE. Existing booking prices are immutable
   and will not change when pricing rules are updated.
5. booking_status_history.changed_by uses ON DELETE SET NULL so deleting a
   user profile preserves the historical record (the identity is lost but
   the audit trail remains).
*/

-- ============ 1. Create booking_status_history table ============

CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id
  ON public.booking_status_history (booking_id, created_at DESC);

-- ============ 2. update_booking_status function (admin) ============

CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id uuid,
  p_new_status text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_valid boolean;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to perform this action.';
  END IF;

  -- Must be admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change booking status.';
  END IF;

  -- Validate new_status value
  IF p_new_status NOT IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status value.';
  END IF;

  -- Load current status
  SELECT status INTO v_current_status
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- No-op if same status
  IF v_current_status = p_new_status THEN
    RETURN p_new_status;
  END IF;

  -- Validate transition
  v_valid := false;
  v_valid := v_valid OR (v_current_status = 'pending' AND p_new_status IN ('confirmed', 'cancelled'));
  v_valid := v_valid OR (v_current_status = 'confirmed' AND p_new_status IN ('in_progress', 'cancelled'));
  v_valid := v_valid OR (v_current_status = 'in_progress' AND p_new_status = 'completed');

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid status transition from % to %.', v_current_status, p_new_status;
  END IF;

  -- Atomically update status
  UPDATE public.bookings
  SET status = p_new_status
  WHERE id = p_booking_id;

  -- Record history
  INSERT INTO public.booking_status_history (booking_id, old_status, new_status, changed_by)
  VALUES (p_booking_id, v_current_status, p_new_status, auth.uid());

  RETURN p_new_status;
END;
$$;

-- ============ 3. cancel_own_booking function (customer) ============

CREATE OR REPLACE FUNCTION public.cancel_own_booking(
  p_booking_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_customer_id uuid;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to cancel a booking.';
  END IF;

  -- Load booking
  SELECT status, customer_id INTO v_current_status, v_customer_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  -- Must own the booking
  IF v_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only cancel your own bookings.';
  END IF;

  -- Must be in a cancellable state
  IF v_current_status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'This booking cannot be cancelled in its current state (%).', v_current_status;
  END IF;

  -- Atomically update status
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Record history
  INSERT INTO public.booking_status_history (booking_id, old_status, new_status, changed_by)
  VALUES (p_booking_id, v_current_status, 'cancelled', auth.uid());

  RETURN 'cancelled';
END;
$$;

-- ============ 4. Trigger: record initial booking creation in history ============

CREATE OR REPLACE FUNCTION public.record_booking_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.booking_status_history (booking_id, old_status, new_status, changed_by)
  VALUES (NEW.id, NULL, NEW.status, NEW.customer_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_booking_creation_trigger ON public.bookings;
CREATE TRIGGER record_booking_creation_trigger
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.record_booking_creation();

-- ============ 5. Trigger: enforce valid status transitions on UPDATE ============

CREATE OR REPLACE FUNCTION public.enforce_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  -- Only enforce when status is actually changing
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_valid := false;
    v_valid := v_valid OR (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled'));
    v_valid := v_valid OR (OLD.status = 'confirmed' AND NEW.status IN ('in_progress', 'cancelled'));
    v_valid := v_valid OR (OLD.status = 'in_progress' AND NEW.status = 'completed');

    IF NOT v_valid THEN
      RAISE EXCEPTION 'Invalid status transition from % to %.', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_booking_status_transition_trigger ON public.bookings;
CREATE TRIGGER enforce_booking_status_transition_trigger
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_status_transition();

-- ============ 6. RLS policies for booking_status_history ============

-- Customers can read history for their own bookings; admins can read all
DROP POLICY IF EXISTS "history_select_own_or_admin" ON public.booking_status_history;
CREATE POLICY "history_select_own_or_admin"
ON public.booking_status_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_status_history.booking_id
    AND (bookings.customer_id = auth.uid() OR public.is_admin())
  )
);

-- No INSERT, UPDATE, or DELETE policies — history is append-only via DB functions only

-- ============ 7. Permissions ============

-- Grant table privileges to authenticated (SELECT only for history)
GRANT SELECT ON public.booking_status_history TO authenticated;

-- Grant EXECUTE on RPC functions to authenticated
GRANT EXECUTE ON FUNCTION public.update_booking_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_own_booking(uuid) TO authenticated;

-- Revoke EXECUTE on trigger functions from all roles (internal only)
REVOKE EXECUTE ON FUNCTION public.record_booking_creation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_booking_creation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_booking_creation() FROM public;

REVOKE EXECUTE ON FUNCTION public.enforce_booking_status_transition() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_status_transition() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_status_transition() FROM public;
