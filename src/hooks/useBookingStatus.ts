import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingStatus } from '@/types/database';

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && lower.includes('transition'))
    return 'This status change is not allowed for the current booking state.';
  if (lower.includes('not found') || lower.includes('no rows'))
    return 'This booking could not be found. It may have been removed.';
  if (lower.includes('unique') || lower.includes('duplicate'))
    return 'That time slot is no longer available. Please choose another time.';
  if (lower.includes('past'))
    return 'Please choose a future date and time.';
  if (lower.includes('operating') || lower.includes('09:00'))
    return 'Please choose a time between 9:00 AM and 5:00 PM.';
  return 'We couldn\'t complete this action. Please try again.';
}

export function useBookingStatus() {
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (
    bookingId: string,
    newStatus: BookingStatus,
  ): Promise<boolean> => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return false;
    }
    setActing(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('update_booking_status', {
      p_booking_id: bookingId,
      p_new_status: newStatus,
    });

    setActing(false);

    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return false;
    }
    return data === newStatus;
  }, []);

  const cancelBooking = useCallback(async (bookingId: string): Promise<boolean> => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return false;
    }
    setActing(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('cancel_own_booking', {
      p_booking_id: bookingId,
    });

    setActing(false);

    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return false;
    }
    return data === 'cancelled';
  }, []);

  return { acting, error, updateStatus, cancelBooking, setError };
}
