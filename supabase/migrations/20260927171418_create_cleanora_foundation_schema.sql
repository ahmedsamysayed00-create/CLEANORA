/*
# Cleanora foundation schema

Creates the core tables for the Cleanora cleaning services application:
profiles, services, bookings, and pricing_rules. All tables have Row Level
Security enabled with ownership-based policies.

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — one row per authenticated user
- `full_name` (text) — display name
- `phone` (text, nullable) — contact phone
- `role` (text, default 'customer') — 'customer' or 'admin'
- `created_at`, `updated_at` (timestamptz)

### services
- `id` (uuid, primary key)
- `name` (text, not null)
- `slug` (text, unique, not null) — URL-friendly identifier
- `short_description` (text) — card summary
- `description` (text) — full detail
- `starting_price` (numeric, default 0) — displayed starting price
- `estimated_duration` (text, nullable) — human-readable duration
- `image_url` (text, nullable)
- `is_active` (boolean, default true) — visibility toggle
- `created_at`, `updated_at` (timestamptz)

### bookings
- `id` (uuid, primary key)
- `customer_id` (uuid, references profiles, default auth.uid())
- `service_id` (uuid, references services)
- `property_type` (text, nullable)
- `bedrooms` (int, nullable)
- `bathrooms` (int, nullable)
- `booking_date` (date, nullable)
- `booking_time` (text, nullable)
- `address` (text, nullable)
- `additional_notes` (text, nullable)
- `estimated_price` (numeric, nullable)
- `status` (text, default 'pending') — pending|confirmed|in_progress|completed|cancelled
- `created_at`, `updated_at` (timestamptz)

### pricing_rules
- `id` (uuid, primary key)
- `service_id` (uuid, references services, nullable) — null = global rule
- `rule_key` (text, not null) — e.g. 'bedroom_base', 'bathroom_base'
- `rule_label` (text) — human-readable label
- `price_modifier` (numeric, default 0) — additive or multiplicative amount
- `modifier_type` (text, default 'additive') — 'additive' or 'multiplier'
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

## 2. Security

- RLS enabled on all tables.
- profiles: users read/update only their own row; admins read all.
- services: public read (anon + authenticated) for active services; admins manage all.
- bookings: customers manage only their own bookings; admins manage all.
- pricing_rules: public read for active rules; admins manage all.
- Admin access is gated through a helper function `is_admin()` that checks the
  profiles table for role = 'admin' for the current authenticated user.

## 3. Important Notes

1. The profiles table is linked to auth.users via a foreign key with CASCADE
   delete so deleting a user removes their profile.
2. Admin detection uses a SECURITY DEFINER function `is_admin()` to avoid RLS
   recursion on the profiles table.
3. Services are publicly readable so the public services page works without
   authentication.
4. The bookings.customer_id defaults to auth.uid() so inserts from authenticated
   customers succeed even when the client omits customer_id.
5. An index on bookings(customer_id) and services(slug) improves query performance.
*/

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ services ============
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text,
  description text,
  starting_price numeric NOT NULL DEFAULT 0,
  estimated_duration text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services (slug);

-- ============ bookings ============
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  property_type text,
  bedrooms int,
  bathrooms int,
  booking_date date,
  booking_time text,
  address text,
  additional_notes text,
  estimated_price numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- ============ pricing_rules ============
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  rule_key text NOT NULL,
  rule_label text,
  price_modifier numeric NOT NULL DEFAULT 0,
  modifier_type text NOT NULL DEFAULT 'additive' CHECK (modifier_type IN ('additive', 'multiplier')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_id ON public.pricing_rules (service_id);

-- ============ helper: is_admin ============
-- SECURITY DEFINER so it can read profiles without hitting RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ RLS policies ============

-- profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- services
DROP POLICY IF EXISTS "services_select_public_or_admin" ON public.services;
CREATE POLICY "services_select_public_or_admin"
ON public.services FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "services_insert_admin" ON public.services;
CREATE POLICY "services_insert_admin"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_update_admin" ON public.services;
CREATE POLICY "services_update_admin"
ON public.services FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "services_delete_admin" ON public.services;
CREATE POLICY "services_delete_admin"
ON public.services FOR DELETE
TO authenticated
USING (public.is_admin());

-- bookings
DROP POLICY IF EXISTS "bookings_select_own_or_admin" ON public.bookings;
CREATE POLICY "bookings_select_own_or_admin"
ON public.bookings FOR SELECT
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
CREATE POLICY "bookings_insert_own"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "bookings_update_own_or_admin" ON public.bookings;
CREATE POLICY "bookings_update_own_or_admin"
ON public.bookings FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin())
WITH CHECK (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "bookings_delete_own_or_admin" ON public.bookings;
CREATE POLICY "bookings_delete_own_or_admin"
ON public.bookings FOR DELETE
TO authenticated
USING (customer_id = auth.uid() OR public.is_admin());

-- pricing_rules
DROP POLICY IF EXISTS "pricing_rules_select_public_or_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select_public_or_admin"
ON public.pricing_rules FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "pricing_rules_insert_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_insert_admin"
ON public.pricing_rules FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pricing_rules_update_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_update_admin"
ON public.pricing_rules FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pricing_rules_delete_admin" ON public.pricing_rules;
CREATE POLICY "pricing_rules_delete_admin"
ON public.pricing_rules FOR DELETE
TO authenticated
USING (public.is_admin());