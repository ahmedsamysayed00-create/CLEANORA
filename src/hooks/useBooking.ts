import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingWithDetails } from '@/types/database';

type BookingState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'success'; booking: BookingWithDetails };

export function useBooking(bookingId: string | undefined) {
  const [state, setState] = useState<BookingState>({ status: 'loading' });

  const load = useCallback(async () => {
    if (!bookingId) {
      setState({ status: 'not-found' });
      return;
    }
    if (!supabase) {
      setState({ status: 'error', message: 'Supabase is not configured.' });
      return;
    }
    setState({ status: 'loading' });

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, slug, description, starting_price, is_active),
        customer:profiles(id, full_name, phone)
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      setState({ status: 'error', message: error.message });
    } else if (!data) {
      setState({ status: 'not-found' });
    } else {
      setState({ status: 'success', booking: data as BookingWithDetails });
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
