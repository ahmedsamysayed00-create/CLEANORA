/*
# Notification abstraction layer

This module provides a clean boundary for future notification integrations
(email, SMS, push, etc.) without implementing any external delivery today.

For Phase 6, all notifications are UI-level only (toast messages). When a
real provider is configured in a future phase, these functions can be extended
to also trigger external delivery without changing call sites.

No fake delivery is performed. No fake notification records are created.
*/

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_in_progress'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_conflict'
  | 'profile_updated'
  | 'service_created'
  | 'service_updated'
  | 'service_deleted'
  | 'pricing_rule_added'
  | 'pricing_rule_deleted';

export const NOTIFICATION_MESSAGES: Record<NotificationType, string> = {
  booking_created: 'Booking submitted successfully.',
  booking_confirmed: 'Booking confirmed.',
  booking_in_progress: 'Service started.',
  booking_completed: 'Booking marked as completed.',
  booking_cancelled: 'Booking cancelled successfully.',
  booking_conflict: 'That time slot is no longer available. Please choose another time.',
  profile_updated: 'Profile updated successfully.',
  service_created: 'Service created successfully.',
  service_updated: 'Service updated successfully.',
  service_deleted: 'Service deleted.',
  pricing_rule_added: 'Pricing rule added.',
  pricing_rule_deleted: 'Pricing rule deleted.',
};
