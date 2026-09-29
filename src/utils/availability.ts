export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface SlotAvailability {
  time: string;
  available: boolean;
}

export function formatSlotLabel(time: string): string {
  const [h, m] = time.split(':');
  const hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateStr + 'T00:00:00');
  return selected < today;
}

export function friendlyErrorMessage(rawError: string): string {
  const lower = rawError.toLowerCase();
  if (lower.includes('past') || lower.includes('already passed'))
    return 'Please choose a future date and time.';
  if (lower.includes('operating') || lower.includes('09:00') || lower.includes('17:00'))
    return 'Please choose a time between 9:00 AM and 5:00 PM.';
  if (lower.includes('unique') || lower.includes('duplicate') || lower.includes('conflict'))
    return 'That time slot is no longer available. Please choose another time.';
  if (lower.includes('service not found') || lower.includes('inactive'))
    return 'This service is currently unavailable.';
  return 'We couldn\'t complete your booking. Please try again.';
}
