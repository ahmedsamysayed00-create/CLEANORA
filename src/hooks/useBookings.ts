import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types/database';

type BookingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; bookings: Booking[] };

export function useBookings() {
  const { user } = useAuth();
  const [state, setState] = useState<BookingsState>({ status: 'loading' });

  const load = async () => {
    if (!supabase || !user) {
      setState({ status: 'success', bookings: [] });
      return;
    }
    setState({ status: 'loading' });
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setState({ status: 'error', message: error.message });
    } else {
      setState({ status: 'success', bookings: (data as Booking[]) ?? [] });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { state, reload: load };
}

type AllBookingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; bookings: Booking[] };

export function useAllBookings() {
  const [state, setState] = useState<AllBookingsState>({ status: 'loading' });

  const load = async () => {
    if (!supabase) {
      setState({ status: 'success', bookings: [] });
      return;
    }
    setState({ status: 'loading' });
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setState({ status: 'error', message: error.message });
    } else {
      setState({ status: 'success', bookings: (data as Booking[]) ?? [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { state, reload: load };
}
