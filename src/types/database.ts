export type UserRole = 'customer' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ModifierType = 'additive' | 'multiplier';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  starting_price: number;
  estimated_duration: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  booking_date: string | null;
  booking_time: string | null;
  address: string | null;
  additional_notes: string | null;
  estimated_price: number | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  service?: Pick<Service, 'id' | 'name' | 'slug' | 'description' | 'starting_price' | 'is_active'> | null;
  customer?: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  customer_email?: string | null;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string | null;
  created_at: string;
  changed_by_name?: string | null;
}

export interface PricingRule {
  id: string;
  service_id: string | null;
  rule_key: string;
  rule_label: string | null;
  price_modifier: number;
  modifier_type: ModifierType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
