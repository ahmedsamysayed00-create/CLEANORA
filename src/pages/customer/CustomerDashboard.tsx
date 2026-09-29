import { CalendarDays, Clock, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useServices } from '@/hooks/useServices';
import { formatBookingRef, formatPrice, formatDate, formatTime, STATUS_LABELS } from '@/utils/bookingStatus';
import type { Booking, Service } from '@/types/database';

interface BookingWithService extends Booking {
  service?: Pick<Service, 'id' | 'name'> | null;
}

export function CustomerDashboard() {
  const { profile } = useAuth();
  const { state, reload } = useBookings();
  const servicesState = useServices();

  const bookings = state.status === 'success' ? (state.bookings as BookingWithService[]) : [];
  const services = servicesState.status === 'success' ? servicesState.services : [];

  const getServiceName = (b: BookingWithService) =>
    b.service?.name ?? services.find((s) => s.id === b.service_id)?.name ?? 'Service';

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const totalSpent = bookings
    .filter((b) => b.status === 'completed' && b.estimated_price != null)
    .reduce((sum, b) => sum + Number(b.estimated_price), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = bookings
    .filter((b) => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      if (!b.booking_date) return true;
      return new Date(b.booking_date + 'T00:00:00') >= today;
    })
    .sort((a, b) => (a.booking_date ?? '').localeCompare(b.booking_date ?? ''));

  const nextBooking = upcoming[0];
  const recent = bookings.slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">
          Welcome, {profile?.full_name || 'Customer'}
        </h1>
        <p className="mt-1 text-sm text-secondary-500">Here is an overview of your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Bookings" value={total} icon={CalendarDays} />
        <StatCard label="Active" value={pending} icon={Clock} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} />
        <StatCard label="Total Spent" value={`$${totalSpent.toFixed(0)}`} icon={DollarSign} />
      </div>

      {/* Upcoming Booking Highlight */}
      {state.status === 'success' && nextBooking && (
        <Card className="mt-8 overflow-hidden">
          <div className="border-b border-secondary-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-secondary-900">Next Booking</h2>
          </div>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-secondary-900">{getServiceName(nextBooking)}</p>
              <p className="mt-1 text-sm text-secondary-600">
                {formatDate(nextBooking.booking_date)} at {formatTime(nextBooking.booking_time)}
              </p>
              <p className="mt-0.5 text-xs text-secondary-500">
                {formatBookingRef(nextBooking.id)} · {STATUS_LABELS[nextBooking.status]}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-primary-700">
                {formatPrice(nextBooking.estimated_price)}
              </span>
              <LinkButton to={`/customer/bookings/${nextBooking.id}`} size="sm">
                View Details
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LinkButton>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <LinkButton to="/book" className="justify-start p-5 text-left">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Book a Cleaning</p>
            <p className="text-xs opacity-80">Schedule a new service</p>
          </div>
        </LinkButton>
        <LinkButton to="/customer/bookings" variant="outline" className="justify-start p-5 text-left">
          <Clock className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="font-semibold">View Bookings</p>
            <p className="text-xs opacity-80">Track your bookings</p>
          </div>
        </LinkButton>
        <LinkButton to="/customer/profile" variant="outline" className="justify-start p-5 text-left">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="font-semibold">My Profile</p>
            <p className="text-xs opacity-80">Update your information</p>
          </div>
        </LinkButton>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Bookings</h2>
          <LinkButton to="/customer/bookings" variant="ghost" size="sm">View all</LinkButton>
        </div>
        {state.status === 'loading' && <LoadingState label="Loading bookings…" />}
        {state.status === 'error' && (
          <ErrorState title="Couldn't load bookings" description={state.message} onRetry={reload} />
        )}
        {state.status === 'success' && recent.length === 0 && (
          <Card className="p-8">
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="When you book a cleaning service, your bookings will appear here."
              action={<LinkButton to="/book">Book a service</LinkButton>}
            />
          </Card>
        )}
        {state.status === 'success' && recent.length > 0 && (
          <div className="grid gap-4">
            {recent.map((b) => (
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
      </div>
    </div>
  );
}
