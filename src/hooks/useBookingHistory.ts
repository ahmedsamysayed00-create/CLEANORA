import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingStatusHistory } from '@/types/database';

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; history: BookingStatusHistory[] };

export function useBookingHistory(bookingId: string | undefined) {
  const [state, setState] = useState<HistoryState>({ status: 'loading' });

  const load = useCallback(async () => {
    if (!bookingId) {
      setState({ status: 'success', history: [] });
      return;
    }
    if (!supabase) {
      setState({ status: 'error', message: 'Supabase is not configured.' });
      return;
    }
    setState({ status: 'loading' });

    const { data, error } = await supabase
      .from('booking_status_history')
      .select(`
        *,
        changed_by_name:changed_by(full_name)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      setState({ status: 'error', message: error.message });
    } else {
      setState({ status: 'success', history: (data as BookingStatusHistory[]) ?? [] });
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
