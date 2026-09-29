import { useState, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { BookingCard } from '@/components/BookingCard';
import { useBookings } from '@/hooks/useBookings';
import { useServices } from '@/hooks/useServices';
import type { Booking, Service } from '@/types/database';

type Tab = 'upcoming' | 'past' | 'cancelled';

interface BookingWithService extends Booking {
  service?: Pick<Service, 'id' | 'name'> | null;
}

export function CustomerBookings() {
  const { state, reload } = useBookings();
  const servicesState = useServices();
  const [tab, setTab] = useState<Tab>('upcoming');

  const services = servicesState.status === 'success' ? servicesState.services : [];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const bookings = useMemo(
    () => state.status === 'success' ? (state.bookings as BookingWithService[]) : [],
    [state],
  );

  const getServiceName = (b: BookingWithService) =>
    b.service?.name ?? services.find((s) => s.id === b.service_id)?.name ?? 'Service';

  const filtered = useMemo(() => {
    if (tab === 'upcoming') {
      return bookings.filter((b) => {
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        if (!b.booking_date) return true;
        return new Date(b.booking_date + 'T00:00:00') >= today;
      });
    }
    if (tab === 'past') {
      return bookings.filter((b) => {
        if (b.status === 'cancelled') return false;
        if (b.status === 'completed') return true;
        if (!b.booking_date) return false;
        return new Date(b.booking_date + 'T00:00:00') < today;
      });
    }
    return bookings.filter((b) => b.status === 'cancelled');
  }, [bookings, tab, today]);

  const counts = useMemo(() => {
    let upcoming = 0, past = 0, cancelled = 0;
    for (const b of bookings) {
      if (b.status === 'cancelled') { cancelled++; continue; }
      if (b.status === 'completed') { past++; continue; }
      if (b.booking_date && new Date(b.booking_date + 'T00:00:00') < today) { past++; continue; }
      upcoming++;
    }
    return { upcoming, past, cancelled };
  }, [bookings, today]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'past', label: 'Past', count: counts.past },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Bookings</h1>
          <p className="mt-1 text-sm text-secondary-500">View and track your cleaning bookings.</p>
        </div>
        <LinkButton to="/book">Book a service</LinkButton>
      </div>

      {state.status === 'loading' && <LoadingState label="Loading bookings…" />}
      {state.status === 'error' && (
        <ErrorState title="Couldn't load bookings" description={state.message} onRetry={reload} />
      )}

      {state.status === 'success' && bookings.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={CalendarDays}
            title="No bookings yet"
            description="You haven't booked any services yet. Get started by booking your first cleaning."
            action={<LinkButton to="/book">Book a service</LinkButton>}
          />
        </Card>
      )}

      {state.status === 'success' && bookings.length > 0 && (
        <>
          {/* Tab bar */}
          <div className="mb-6 flex gap-1 rounded-xl bg-secondary-100 p-1" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-white text-secondary-900 shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={CalendarDays}
                title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past bookings' : 'No cancelled bookings'}
                description={
                  tab === 'upcoming'
                    ? 'Book a cleaning service to see it here.'
                    : tab === 'past'
                      ? 'Your completed bookings will appear here.'
                      : 'Your cancelled bookings will appear here.'
                }
                action={tab === 'upcoming' ? <LinkButton to="/book">Book a service</LinkButton> : undefined}
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  serviceName={getServiceName(b)}
                  showRef
                  to={`/customer/bookings/${b.id}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
