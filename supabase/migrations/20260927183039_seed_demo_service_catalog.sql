/*
# Seed fictional demo service catalog

## Summary

Inserts five fictional portfolio/demo services into the services table.
These are NOT real business records — they exist for portfolio demonstration
purposes only. No fake customers, bookings, reviews, or revenue are created.

## Services seeded

1. Standard Cleaning — slug: standard-cleaning — $80
2. Deep Cleaning — slug: deep-cleaning — $150
3. Move-In / Move-Out Cleaning — slug: move-in-move-out — $220
4. Office Cleaning — slug: office-cleaning — $120
5. Window Cleaning — slug: window-cleaning — $90

## Idempotency

Each insert uses ON CONFLICT (slug) DO NOTHING so the migration is safe
to re-run without creating duplicates. If a service with the same slug
already exists, it is left unchanged.

## Security

No RLS or permission changes. Services are publicly readable via the
existing services_select_public_or_admin policy. Admin management
remains gated by is_admin().

## Important notes

1. No existing data is modified or deleted.
2. All services are created with is_active = true.
3. Short descriptions are included for catalog card display.
4. No fake bookings, customers, reviews, or revenue are introduced.
*/

INSERT INTO public.services (name, slug, short_description, description, starting_price, is_active)
VALUES
  (
    'Standard Cleaning',
    'standard-cleaning',
    'Reliable recurring cleaning for apartments and homes needing regular maintenance.',
    'A reliable recurring cleaning service for apartments and homes that need regular maintenance and everyday freshness. Our standard cleaning covers dusting, vacuuming, mopping, kitchen surfaces, bathroom sanitizing, and general tidying — keeping your space consistently fresh week after week.',
    80,
    true
  ),
  (
    'Deep Cleaning',
    'deep-cleaning',
    'Detailed top-to-bottom cleaning for spaces that need extra attention.',
    'A detailed top-to-bottom cleaning designed for spaces that need extra attention, including hard-to-reach areas and built-up dirt. Deep cleaning goes beyond our standard service to address baseboards, light fixtures, inside appliances, grout scrubbing, and areas that often get overlooked during regular cleaning.',
    150,
    true
  ),
  (
    'Move-In / Move-Out Cleaning',
    'move-in-move-out',
    'Prepare a property for a new resident or leave it ready for its next occupant.',
    'A detailed cleaning service designed to prepare a property for a new resident or leave it ready for its next occupant. Move-in/move-out cleaning includes interior cabinet wiping, appliance interiors, window sills, thorough bathroom sanitizing, floor care, and attention to every room so the property feels fresh and move-in ready.',
    220,
    true
  ),
  (
    'Office Cleaning',
    'office-cleaning',
    'Professional cleaning for small offices and shared workspaces.',
    'Professional cleaning for small offices and workspaces, helping keep shared areas, desks, floors, and facilities presentable. Office cleaning covers common areas, individual workstations, restrooms, kitchenettes, glass doors, and high-touch surfaces — supporting a clean and productive work environment.',
    120,
    true
  ),
  (
    'Window Cleaning',
    'window-cleaning',
    'Focused glass and window cleaning for residential and commercial spaces.',
    'Focused glass and window cleaning to improve visibility and give residential and commercial spaces a cleaner finish. Window cleaning addresses interior and exterior glass surfaces, frames, sills, and screens — bringing in more natural light and enhancing the overall appearance of your property.',
    90,
    true
  )
ON CONFLICT (slug) DO NOTHING;