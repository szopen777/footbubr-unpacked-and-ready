/*
# Add missing columns to products table

The admin form sends size_eu, insole_length_cm, surface_type, level, and status
but these columns don't exist in the database, causing every INSERT/UPDATE to fail.
*/

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size_eu numeric,
  ADD COLUMN IF NOT EXISTS insole_length_cm numeric,
  ADD COLUMN IF NOT EXISTS surface_type text DEFAULT 'FG',
  ADD COLUMN IF NOT EXISTS level text DEFAULT 'Profesjonalny',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';

-- Backfill existing rows so they have sensible defaults
UPDATE public.products SET status = 'available' WHERE status IS NULL;
UPDATE public.products SET surface_type = 'FG' WHERE surface_type IS NULL;
UPDATE public.products SET level = 'Profesjonalny' WHERE level IS NULL;
