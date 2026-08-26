/*
# Add tracking_number and order_number to orders table

## Purpose
The admin panel needs to store a parcel tracking number (InPost/Kurier) for each
order, and orders need human-readable sequential numbers (#FB-2026-001 format).

## Changes
1. Adds `tracking_number` column (text, nullable) to `orders` — stores the
   InPost/Kurier tracking code that the admin enters when marking an order as
   shipped.
2. Adds `order_number` column (integer, nullable) to `orders` — stores a
   sequential per-year integer used to render the human-readable order ID.
3. Adds a backfill block that assigns `order_number` to existing rows that
   don't have one yet, based on their `created_at` order.

## Security
No RLS or policy changes — existing policies on `orders` already allow
anon/authenticated CRUD.
*/

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number integer;

-- Backfill: assign sequential numbers to existing orders, ordered by created_at
DO $$
DECLARE
  row RECORD;
  counter integer := 1;
BEGIN
  FOR row IN
    SELECT id FROM public.orders WHERE order_number IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.orders SET order_number = counter WHERE id = row.id;
    counter := counter + 1;
  END LOOP;
END $$;
