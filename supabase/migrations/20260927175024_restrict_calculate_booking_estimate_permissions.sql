/*
# Restrict execute permissions on calculate_booking_estimate

The calculate_booking_estimate function is called internally by the
enforce_booking_price trigger, not directly by clients. Revoke EXECUTE
from anon and public to prevent direct RPC calls. The trigger's
SECURITY DEFINER function can still call it internally.
*/

REVOKE EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.calculate_booking_estimate(uuid, text, int, int) TO authenticated;