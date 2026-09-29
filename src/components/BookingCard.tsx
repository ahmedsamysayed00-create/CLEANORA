import { CalendarDays, Clock, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BookingStatus, Booking } from '@/types/database';
import { formatBookingRef, formatDate } from '@/utils/bookingStatus';

const statusConfig: Record<BookingStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning-100 text-warning-700' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, className: 'bg-accent-100 text-accent-700' },
  in_progress: { label: 'In Progress', icon: Loader2, className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-success-100 text-success-700' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-error-100 text-error-700' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'in_progress' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

interface BookingCardProps {
  booking: Booking;
  to?: string;
  serviceName?: string;
  showRef?: boolean;
}

export function BookingCard({ booking, to, serviceName, showRef = false }: BookingCardProps) {
  const dateStr = formatDate(booking.booking_date);
  const linkTo = to ?? '#';

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          {showRef && (
            <p className="text-xs font-medium text-secondary-400">{formatBookingRef(booking.id)}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-secondary-500">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {dateStr}
            {booking.booking_time && <span>at {booking.booking_time}</span>}
          </div>
          {serviceName && (
            <p className="mt-1.5 text-sm font-semibold text-secondary-900">{serviceName}</p>
          )}
          <p className="mt-1 text-sm text-secondary-600">
            {booking.property_type ?? 'Property type not specified'}
            {booking.bedrooms != null && ` · ${booking.bedrooms} bed`}
            {booking.bathrooms != null && ` · ${booking.bathrooms} bath`}
          </p>
          {booking.address && (
            <p className="mt-1 text-sm text-secondary-500">{booking.address}</p>
          )}
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      {booking.estimated_price != null && (
        <p className="mt-3 text-sm font-semibold text-primary-700">
          Estimated: ${Number(booking.estimated_price).toFixed(0)}
        </p>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={linkTo}
        className="group block rounded-2xl border border-secondary-200 bg-white p-5 shadow-card transition-all hover:border-primary-300 hover:shadow-lg"
      >
        {content}
        <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-card">
      {content}
    </div>
  );
}
