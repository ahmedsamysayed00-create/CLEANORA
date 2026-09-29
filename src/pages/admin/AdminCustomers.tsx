import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; customers: Profile[] };

export function AdminCustomers() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    (async () => {
      if (!supabase) {
        setState({ status: 'success', customers: [] });
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) setState({ status: 'error', message: 'We couldn\'t load customers. Please try again.' });
      else setState({ status: 'success', customers: (data as Profile[]) ?? [] });
    })();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
        <p className="mt-1 text-sm text-secondary-500">View registered customer accounts.</p>
      </div>

      {state.status === 'loading' && <LoadingState label="Loading customers…" />}
      {state.status === 'error' && <ErrorState title="Couldn't load customers" description={state.message} />}
      {state.status === 'success' && state.customers.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="When customers sign up, they will appear here."
          />
        </Card>
      )}
      {state.status === 'success' && state.customers.length > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-secondary-200 bg-secondary-50 text-secondary-600">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Name</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Phone</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {state.customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary-50">
                    <td className="px-6 py-4 font-medium text-secondary-900">{c.full_name || '—'}</td>
                    <td className="px-6 py-4 text-secondary-600">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-secondary-500">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {state.customers.map((c) => (
              <Card key={c.id} className="p-4">
                <p className="font-medium text-secondary-900">{c.full_name || '—'}</p>
                <p className="mt-1 text-sm text-secondary-600">{c.phone || 'No phone'}</p>
                <p className="mt-1 text-xs text-secondary-500">
                  Joined {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
