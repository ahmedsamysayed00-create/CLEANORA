import { CheckCircle2, XCircle, Clock, Loader2, Calendar } from 'lucide-react';
import type { BookingStatusHistory } from '@/types/database';
import { STATUS_LABELS, formatDateTime } from '@/utils/bookingStatus';

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle2,
  in_progress: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const statusColor: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  confirmed: 'bg-accent-100 text-accent-700',
  in_progress: 'bg-primary-100 text-primary-700',
  completed: 'bg-success-100 text-success-700',
  cancelled: 'bg-error-100 text-error-700',
};

export function StatusTimeline({ history }: { history: BookingStatusHistory[] }) {
  if (history.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-secondary-500">
        No status history available for this booking.
      </p>
    );
  }

  const reversed = [...history].reverse();

  return (
    <ol className="relative space-y-6">
      {reversed.map((entry, idx) => {
        const Icon = entry.new_status ? statusIcon[entry.new_status] ?? Clock : Calendar;
        const colorClass = entry.new_status ? statusColor[entry.new_status] ?? 'bg-secondary-100 text-secondary-600' : 'bg-secondary-100 text-secondary-600';
        const isLast = idx === reversed.length - 1;
        const label = entry.old_status
          ? `Moved to ${STATUS_LABELS[entry.new_status]}`
          : `Booking created as ${STATUS_LABELS[entry.new_status]}`;
        return (
          <li key={entry.id} className="relative flex gap-4">
            {!isLast && (
              <span className="absolute left-5 top-12 h-full w-px bg-secondary-200" aria-hidden="true" />
            )}
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className={`h-5 w-5 ${entry.new_status === 'in_progress' ? 'animate-spin' : ''}`} aria-hidden="true" />
            </span>
            <div className="pt-1.5">
              <p className="text-sm font-semibold text-secondary-900">{label}</p>
              <p className="mt-0.5 text-xs text-secondary-500">
                {formatDateTime(entry.created_at)}
                {entry.changed_by_name && ` · by ${entry.changed_by_name}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
