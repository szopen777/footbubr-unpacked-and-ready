/*
# Add 'processing' to orders.status + Create drop_settings & drop_subscribers

1. Modified Tables
- `orders`: add 'processing' to the status check constraint so the admin can
  set "W realizacji" (In Progress). Existing values preserved: pending, paid,
  shipped, completed, cancelled. New: processing.

2. New Tables
- `drop_settings`: single-row settings store for the next drop.
  - id (int, primary key, always 1)
  - drop_date (timestamptz, nullable — null means "no date / coming soon")
  - is_tbd (boolean, default false — when true, shows "Wkrótce" box)
  - featured_product_id (uuid, nullable, references products)
  - title (text, default 'Nowy drop')
  - subtitle (text, default '')
  - created_at / updated_at (timestamptz)

- `drop_subscribers`: email signups for drop notifications.
  - id (uuid, primary key)
  - email (text, not null)
  - drop_settings_id (int, nullable, references drop_settings)
  - created_at (timestamptz)

3. Security
- `drop_settings`: RLS enabled. anon+authenticated can SELECT (public reads
  settings on the homepage). anon+authenticated can INSERT/UPDATE/DELETE
  (admin panel uses anon key — no auth flow in this app).
- `drop_subscribers`: RLS enabled. anon+authenticated can INSERT (public signup
  form). anon+authenticated can SELECT (admin reads subscribers). No UPDATE/
  DELETE needed.

4. Seed
- Insert a single default row (id=1, is_tbd=true) so the homepage always has
  settings to read.
*/

-- 1. Fix orders status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text]));

-- 2. Create drop_settings
CREATE TABLE IF NOT EXISTS public.drop_settings (
  id integer PRIMARY KEY DEFAULT 1,
  drop_date timestamptz,
  is_tbd boolean NOT NULL DEFAULT true,
  featured_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Nowy drop',
  subtitle text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT drop_settings_single_row CHECK (id = 1)
);

ALTER TABLE public.drop_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_drop_settings" ON public.drop_settings;
CREATE POLICY "anon_select_drop_settings" ON public.drop_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_drop_settings" ON public.drop_settings;
CREATE POLICY "anon_insert_drop_settings" ON public.drop_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_drop_settings" ON public.drop_settings;
CREATE POLICY "anon_update_drop_settings" ON public.drop_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_drop_settings" ON public.drop_settings;
CREATE POLICY "anon_delete_drop_settings" ON public.drop_settings
  FOR DELETE TO anon, authenticated USING (true);

-- 3. Create drop_subscribers
CREATE TABLE IF NOT EXISTS public.drop_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  drop_settings_id integer REFERENCES public.drop_settings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drop_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_drop_subscribers" ON public.drop_subscribers;
CREATE POLICY "anon_insert_drop_subscribers" ON public.drop_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_drop_subscribers" ON public.drop_subscribers;
CREATE POLICY "anon_select_drop_subscribers" ON public.drop_subscribers
  FOR SELECT TO anon, authenticated USING (true);

-- 4. Seed default row
INSERT INTO public.drop_settings (id, is_tbd, title, subtitle)
VALUES (1, true, 'Nowy drop', 'Przygotowujemy kolejne unikatowe pary.')
ON CONFLICT (id) DO NOTHING;
