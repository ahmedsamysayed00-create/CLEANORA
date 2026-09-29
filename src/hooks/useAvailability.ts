import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SlotAvailability } from '@/utils/availability';

type AvailabilityState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; slots: SlotAvailability[] };

export function useAvailability() {
  const [state, setState] = useState<AvailabilityState>({ status: 'idle' });

  const fetchSlots = useCallback(async (date: string) => {
    if (!date) {
      setState({ status: 'idle' });
      return;
    }
    if (!supabase) {
      setState({ status: 'error', message: 'Supabase is not configured.' });
      return;
    }
    setState({ status: 'loading' });

    const { data, error } = await supabase.rpc('get_available_slots', {
      p_target_date: date,
    });

    if (error) {
      setState({ status: 'error', message: error.message });
    } else {
      const slots = (data as SlotAvailability[]) ?? [];
      setState({ status: 'success', slots });
    }
  }, []);

  return { state, fetchSlots };
}
