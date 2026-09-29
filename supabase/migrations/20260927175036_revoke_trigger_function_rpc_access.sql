/*
# Revoke direct RPC access on trigger functions

The trigger functions enforce_booking_price, prevent_past_booking_date, and
handle_updated_at are internal — they fire via triggers, not via REST RPC.
Revoke EXECUTE from anon, authenticated, and public so no client can call
them directly. Triggers still work because they execute with the function's
own SECURITY DEFINER privileges, not the caller's role.

is_admin() keeps authenticated EXECUTE because RLS policies call it.
calculate_booking_estimate keeps authenticated EXECUTE because the
enforce_booking_price trigger calls it internally via SECURITY DEFINER.
*/

REVOKE EXECUTE ON FUNCTION public.enforce_booking_price() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_price() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_price() FROM public;

REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM anon;
REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_past_booking_date() FROM public;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM public;

-- calculate_booking_estimate is called internally by the trigger;
-- revoke from anon but keep authenticated for potential future admin use
REVOKE EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) FROM public;