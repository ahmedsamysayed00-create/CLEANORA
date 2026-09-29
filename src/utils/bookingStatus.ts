import type { BookingStatus } from '@/types/database';

export const BOOKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

export interface ActionTarget {
  label: string;
  target: BookingStatus;
  destructive?: boolean;
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function getAvailableActions(status: BookingStatus): { label: string; target: BookingStatus; destructive?: boolean }[] {
  return VALID_TRANSITIONS[status].map((target) => {
    if (target === 'cancelled') {
      return { label: 'Cancel Booking', target, destructive: true };
    }
    if (target === 'confirmed') {
      return { label: 'Confirm Booking', target };
    }
    if (target === 'in_progress') {
      return { label: 'Start Service', target };
    }
    if (target === 'completed') {
      return { label: 'Mark Completed', target };
    }
    return { label: STATUS_LABELS[target], target };
  });
}

export function isCancellable(status: BookingStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function isTerminal(status: BookingStatus): boolean {
  return status === 'completed' || status === 'cancelled';
}

export function formatBookingRef(id: string): string {
  return `CLN-${id.slice(0, 6).toUpperCase()}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date not set';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return 'Time not set';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  return `$${Number(price).toFixed(0)}`;
}
