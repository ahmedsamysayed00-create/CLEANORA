import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { PricingRule } from '@/types/database';

type PricingRulesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; rules: PricingRule[] };

export function usePricingRules() {
  const [state, setState] = useState<PricingRulesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) {
        setState({ status: 'error', message: 'Supabase is not configured.' });
        return;
      }
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!active) return;
      if (error) {
        setState({ status: 'error', message: error.message });
      } else {
        setState({ status: 'success', rules: (data as PricingRule[]) ?? [] });
      }
    })();
    return () => { active = false; };
  }, []);

  return state;
}
