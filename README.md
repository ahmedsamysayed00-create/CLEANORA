# Cleanora

A fictional cleaning-services booking and management SaaS built as a portfolio project. Cleanora demonstrates real database-backed workflows, row-level security, dynamic pricing, availability scheduling, and a polished responsive UI — without any fabricated business activity.

> Cleanora is a fictional portfolio/demo application. Customer and booking activity is not real. The service catalog and pricing rules are fictional demo data.

## Features

- **Service catalog** — browse cleaning services with details and starting prices
- **Dynamic pricing** — server-calculated estimates based on property type, bedrooms, and bathrooms
- **Customer authentication** — email/password signup and login via Supabase Auth
- **Booking workflow** — full lifecycle: Pending → Confirmed → In Progress → Completed, with cancellation support
- **Availability scheduling** — 09:00–17:00 operating window with one-hour slots
- **Double-booking protection** — database-level unique index on active slots
- **Admin booking management** — status transitions, filters, search, status history
- **Service & pricing management** — admin CRUD for services and pricing rules
- **Status history** — every booking status change is recorded with timestamps
- **Responsive UI** — mobile, tablet, and desktop layouts
- **Accessibility** — keyboard navigation, ARIA roles, labeled forms, focus management
- **Row-level security** — customers access only their own data; admins manage all data

## Tech Stack

- **React 18** + **TypeScript** — frontend framework
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling
- **React Router** — client-side routing
- **Supabase** — PostgreSQL database, authentication, and RLS
- **lucide-react** — icons

## Architecture

```
Frontend (React/TypeScript)
    ↓
Authenticated Supabase Client (anon key)
    ↓
PostgreSQL / Row-Level Security
    ↓
Secure Database Functions & Triggers
```

Critical business rules are enforced server-side:

- **Pricing** — `enforce_booking_price()` trigger calculates and stores the final price on insert; the client cannot control `estimated_price`
- **Booking status transitions** — `enforce_booking_status_transition()` trigger rejects invalid transitions; `update_booking_status()` RPC handles authorized changes
- **Availability** — `get_available_slots()` RPC returns only available slots; `idx_bookings_unique_active_slot` partial unique index prevents double-booking at the database level
- **Past date/time protection** — `prevent_past_booking_date()` and `enforce_operating_hours()` triggers
- **Cancellation** — `cancel_own_booking()` RPC verifies ownership and valid status before cancelling
- **Role separation** — `is_admin()` function checks the `profiles.role` column; RLS policies use it for admin-only operations
- **Profile creation** — RLS policy enforces `role = 'customer'` on insert, preventing self-promotion to admin

## Security

- **Row-Level Security** enabled on all tables (`profiles`, `services`, `bookings`, `pricing_rules`, `booking_status_history`)
- **Customer isolation** — customers can only read/update their own bookings and profile
- **Admin authorization** — admin actions require `is_admin()` to return true (checked in RLS policies and RPC functions)
- **SECURITY DEFINER functions** — all custom functions have `search_path = public` set; `anon` execute is revoked on all booking-related functions
- **Public read access** — active services and active pricing rules are publicly readable; inactive ones are admin-only
- **No client-controlled pricing** — the `estimated_price` column is set exclusively by the `enforce_booking_price()` trigger

## Demo Data

The database is seeded with:

- **5 fictional services** — e.g. Standard Home Cleaning, Deep Clean, Office Cleaning, Move In/Out Cleaning, Post-Construction Cleaning
- **3 pricing rules** — bedroom and bathroom adjustments, house multiplier

No fake customers, bookings, reviews, testimonials, or revenue data exist in the database.

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Available Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
```

### Database Migrations

Migrations are in `supabase/migrations/` and are applied in order. The Supabase project is pre-provisioned — credentials are in the `.env` file.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Button, Card, Input, States, Toast
│   ├── layout/          # Navbar, Footer, layouts
│   ├── AuthProvider.tsx # Auth context provider
│   ├── BookingCard.tsx  # Booking list item
│   ├── ConfirmDialog.tsx
│   ├── StatusTimeline.tsx
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                 # Supabase client, notifications
├── pages/               # Route pages
│   ├── admin/           # Admin pages
│   ├── customer/        # Customer pages
│   └── ...
├── types/               # TypeScript types
├── utils/               # Pricing, availability, booking status helpers
└── App.tsx              # Router + providers
```
