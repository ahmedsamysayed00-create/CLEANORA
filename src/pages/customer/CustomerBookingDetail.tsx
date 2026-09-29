import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, Home, BedDouble, Bath, MapPin,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { BookingStatusBadge } from '@/components/BookingCard';
import { StatusTimeline } from '@/components/StatusTimeline';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useBooking } from '@/hooks/useBooking';
import { useBookingHistory } from '@/hooks/useBookingHistory';
import { useBookingStatus } from '@/hooks/useBookingStatus';
import {
  formatBookingRef, formatDate, formatTime, formatPrice,
  isCancellable, STATUS_LABELS,
} from '@/utils/bookingStatus';
import type { BookingStatus } from '@/types/database';

function DetailRow({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium text-secondary-400">{label}</p>
        <p className="mt-0.5 text-sm text-secondary-900">{value}</p>
      </div>
    </div>
  );
}

export function CustomerBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, reload } = useBooking(id);
  const { state: historyState, reload: reloadHistory } = useBookingHistory(id);
  const { acting, cancelBooking, setError } = useBookingStatus();
  const { toast } = useToast();

  const [showCancel, setShowCancel] = useState(false);

  const handleCancel = async () => {
    if (!id) return;
    const ok = await cancelBooking(id);
    if (ok) {
      toast('success', 'Your booking has been cancelled.');
      await reload();
      await reloadHistory();
    } else {
      toast('error', 'We couldn\'t cancel this booking. It may have already changed. Please refresh and try again.');
    }
    setShowCancel(false);
  };

  if (state.status === 'loading') {
    return (
      <div>
        <BackLink />
        <LoadingState label="Loading booking details…" />
      </div>
    );
  }

  if (state.status === 'not-found') {
    return (
      <div>
        <BackLink />
        <ErrorState
          title="Booking not found"
          description="This booking may not exist or you may not have access to it."
        />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <BackLink />
        <ErrorState title="Couldn't load booking" description={state.message} onRetry={reload} />
      </div>
    );
  }

  const booking = state.booking;
  const status = booking.status as BookingStatus;
  const service = booking.service;
  const cancellable = isCancellable(status);

  return (
    <div>
      <BackLink />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-secondary-900">
              {formatBookingRef(booking.id)}
            </h1>
            <BookingStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-secondary-500">
            Booked on {formatDate(booking.created_at.slice(0, 10))}
          </p>
        </div>
        {cancellable && (
          <Button
            variant="danger"
            disabled={acting}
            onClick={() => {
              setError(null);
              setShowCancel(true);
            }}
          >
            Cancel Booking
          </Button>
        )}
      </div>

      {status === 'cancelled' && (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 text-error-600">
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-secondary-900">This booking was cancelled</p>
              <p className="text-sm text-secondary-500">No further changes can be made.</p>
            </div>
          </div>
        </Card>
      )}

      {status === 'completed' && (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 text-success-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-secondary-900">This booking is completed</p>
              <p className="text-sm text-secondary-500">Thank you for choosing Cleanora.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-2 text-sm font-semibold text-secondary-900">Service & Property</h2>
            <div className="divide-y divide-secondary-100">
              <DetailRow icon={Home} label="Service" value={service?.name ?? 'Service not specified'} />
              <DetailRow icon={Home} label="Property Type" value={booking.property_type ?? 'Not specified'} />
              <DetailRow icon={BedDouble} label="Bedrooms" value={String(booking.bedrooms ?? 0)} />
              <DetailRow icon={Bath} label="Bathrooms" value={String(booking.bathrooms ?? 0)} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-2 text-sm font-semibold text-secondary-900">Schedule & Location</h2>
            <div className="divide-y divide-secondary-100">
              <DetailRow icon={CalendarDays} label="Date" value={formatDate(booking.booking_date)} />
              <DetailRow icon={Clock} label="Time" value={formatTime(booking.booking_time)} />
              <DetailRow icon={MapPin} label="Address" value={booking.address ?? 'Not provided'} />
            </div>
            {booking.additional_notes && (
              <div className="mt-4 rounded-xl bg-secondary-50 p-4">
                <p className="text-xs font-medium text-secondary-400">Additional Notes</p>
                <p className="mt-1 text-sm text-secondary-700">{booking.additional_notes}</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 text-sm font-semibold text-secondary-900">Status History</h2>
            {historyState.status === 'loading' && <LoadingState label="Loading history…" />}
            {historyState.status === 'error' && (
              <ErrorState title="Couldn't load history" description={historyState.message} onRetry={reloadHistory} />
            )}
            {historyState.status === 'success' && <StatusTimeline history={historyState.history} />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-2 text-sm font-semibold text-secondary-900">Pricing</h2>
            <div className="mt-4 rounded-xl bg-primary-50 p-4 text-center">
              <p className="text-xs text-primary-700">Booking Price</p>
              <p className="mt-1 text-3xl font-bold text-primary-700">
                {formatPrice(booking.estimated_price)}
              </p>
              <p className="mt-2 text-xs text-secondary-500">
                Final price calculated at booking time.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 text-sm font-semibold text-secondary-900">Need Help?</h2>
            <p className="text-sm text-secondary-600">
              Questions about your booking? Contact our team for assistance.
            </p>
            <LinkButton to="/contact" variant="outline" size="sm" className="mt-4">
              Contact Support
            </LinkButton>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this booking?"
        description={`This will move the booking from ${STATUS_LABELS[status]} to Cancelled. The booking will be marked as cancelled and no further changes will be possible.`}
        confirmLabel="Yes, cancel booking"
        destructive
        loading={acting}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );

  function BackLink() {
    return (
      <div className="mb-6">
        <button
          onClick={() => navigate('/customer/bookings')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-600 transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to bookings
        </button>
      </div>
    );
  }
}
