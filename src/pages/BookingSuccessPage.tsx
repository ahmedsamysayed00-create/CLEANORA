import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Clock, Home, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { BookingStatusBadge } from '@/components/BookingCard';
import { useBooking } from '@/hooks/useBooking';
import { formatBookingRef, formatDate, formatTime, formatPrice } from '@/utils/bookingStatus';

export function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useBooking(id);

  if (state.status === 'loading') {
    return <LoadingState label="Loading your booking…" />;
  }

  if (state.status === 'not-found' || state.status === 'error') {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Couldn't load booking"
          description="Your booking was created but we couldn't load the details."
          onRetry={() => navigate('/customer/bookings')}
        />
      </div>
    );
  }

  const booking = state.booking;
  const service = booking.service;

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-100 text-success-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-bold text-secondary-900">Booking confirmed!</h1>
          <p className="mt-2 text-secondary-500">
            Your booking has been submitted and is awaiting confirmation.
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-secondary-400">Booking reference</p>
              <p className="text-lg font-bold text-secondary-900">{formatBookingRef(booking.id)}</p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>

          <dl className="space-y-4 border-t border-secondary-100 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500">
                <Home className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs font-medium text-secondary-400">Service</dt>
                <dd className="text-sm font-medium text-secondary-900">{service?.name ?? 'Service'}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs font-medium text-secondary-400">Date</dt>
                <dd className="text-sm font-medium text-secondary-900">{formatDate(booking.booking_date)}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs font-medium text-secondary-400">Time</dt>
                <dd className="text-sm font-medium text-secondary-900">{formatTime(booking.booking_time)}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
            <p className="text-sm text-primary-700">Estimated price</p>
            <p className="text-xl font-bold text-primary-700">{formatPrice(booking.estimated_price)}</p>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LinkButton to={`/customer/bookings/${booking.id}`} className="flex-1">
            View booking details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          <LinkButton to="/customer/bookings" variant="outline" className="flex-1">
            View my bookings
          </LinkButton>
          <LinkButton to="/customer/dashboard" variant="ghost" className="flex-1">
            Go to dashboard
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
