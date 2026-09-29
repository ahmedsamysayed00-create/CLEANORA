import { CalendarDays, Clock, CheckCircle2, DollarSign, Sparkles, Loader2, XCircle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { BookingStatusBadge } from '@/components/BookingCard';
import { useAllBookings } from '@/hooks/useBookings';
import { useServices } from '@/hooks/useServices';
import { formatBookingRef, formatPrice } from '@/utils/bookingStatus';
import type { Booking, Service } from '@/types/database';

interface BookingWithService extends Booking {
  service?: Pick<Service, 'id' | 'name'> | null;
}

export function AdminDashboard() {
  const { state: bookingsState, reload } = useAllBookings();
  const servicesState = useServices();

  const bookings = bookingsState.status === 'success' ? (bookingsState.bookings as BookingWithService[]) : [];
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
  // Revenue counts completed bookings only
  const revenue = bookings
    .filter((b) => b.status === 'completed' && b.estimated_price != null)
    .reduce((sum, b) => sum + Number(b.estimated_price), 0);

  const recent = bookings.slice(0, 5);
  const serviceCount = servicesState.status === 'success' ? servicesState.services.length : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500">Overview of Cleanora operations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Bookings" value={total} icon={CalendarDays} />
        <StatCard label="Pending" value={pending} icon={Clock} />
        <StatCard label="Confirmed" value={confirmed} icon={CheckCircle2} />
        <StatCard label="In Progress" value={inProgress} icon={Loader2} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} />
        <StatCard label="Cancelled" value={cancelled} icon={XCircle} />
        <StatCard label="Revenue" value={`$${revenue.toFixed(0)}`} icon={DollarSign} />
        <StatCard label="Services" value={serviceCount} icon={Sparkles} />
      </div>

      <p className="mt-3 text-xs text-secondary-400">
        Revenue reflects completed bookings only.
      </p>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Bookings</h2>
          <LinkButton to="/admin/bookings" variant="ghost" size="sm">View all</LinkButton>
        </div>
        {bookingsState.status === 'loading' && <LoadingState label="Loading bookings…" />}
        {bookingsState.status === 'error' && (
          <ErrorState title="Couldn't load bookings" description={bookingsState.message} onRetry={reload} />
        )}
        {bookingsState.status === 'success' && recent.length === 0 && (
          <Card className="p-8">
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="When customers book services, they will appear here."
            />
          </Card>
        )}
        {bookingsState.status === 'success' && recent.length > 0 && (
          <div className="grid gap-3">
            {recent.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-secondary-200 bg-white p-4 shadow-card">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{formatBookingRef(b.id)}</p>
                    <p className="text-xs text-secondary-500">{b.service?.name ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-secondary-700 sm:inline">
                    {formatPrice(b.estimated_price)}
                  </span>
                  <BookingStatusBadge status={b.status} />
                  <LinkButton to={`/admin/bookings/${b.id}`} variant="ghost" size="sm">View</LinkButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
