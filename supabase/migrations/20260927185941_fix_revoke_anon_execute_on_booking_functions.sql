/*
# Fix: Revoke anon/public EXECUTE on cancel_own_booking and update_booking_status

## Issue
The Phase 4 migration created cancel_own_booking and update_booking_status
with SECURITY DEFINER and granted EXECUTE to authenticated, but never
explicitly revoked EXECUTE from anon and public. PostgreSQL grants EXECUTE
to PUBLIC by default on function creation, so both functions were callable
by unauthenticated users via the REST API.

The functions internally check auth.uid() and would reject unauthenticated
calls, but defense in depth requires revoking the permission at the
database level.

## Fix
Revoke EXECUTE from anon and public on both functions. Authenticated retains
EXECUTE. This matches the pattern already in place for get_available_slots
and is_admin.

No other changes. No schema, RLS, or logic modifications.
*/

REVOKE EXECUTE ON FUNCTION public.cancel_own_booking(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_own_booking(uuid) FROM public;

REVOKE EXECUTE ON FUNCTION public.update_booking_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_booking_status(uuid, text) FROM public;
