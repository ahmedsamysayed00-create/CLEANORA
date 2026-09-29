import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/database';

type ServicesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; services: Service[] };

export function useServices() {
  const [state, setState] = useState<ServicesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) {
        setState({ status: 'error', message: 'Supabase is not configured.' });
        return;
      }
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!active) return;
      if (error) {
        setState({ status: 'error', message: error.message });
      } else {
        setState({ status: 'success', services: (data as Service[]) ?? [] });
      }
    })();
    return () => { active = false; };
  }, []);

  return state;
}

type ServiceBySlugState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'success'; service: Service };

export function useServiceBySlug(slug: string | undefined) {
  const [state, setState] = useState<ServiceBySlugState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) {
        setState({ status: 'not-found' });
        return;
      }
      if (!supabase) {
        setState({ status: 'error', message: 'Supabase is not configured.' });
        return;
      }
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setState({ status: 'error', message: error.message });
      } else if (!data || !(data as Service).is_active) {
        setState({ status: 'not-found' });
      } else {
        setState({ status: 'success', service: data as Service });
      }
    })();
    return () => { active = false; };
  }, [slug]);

  return state;
}
