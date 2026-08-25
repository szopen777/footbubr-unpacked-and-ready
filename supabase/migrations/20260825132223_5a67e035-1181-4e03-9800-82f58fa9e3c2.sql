CREATE TABLE IF NOT EXISTS public.drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','published','cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  size_eu numeric(4,1) NOT NULL,
  insole_length_cm numeric(4,1),
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  surface_type text NOT NULL CHECK (surface_type IN ('FG','SG','AG','TF','IC')),
  level text NOT NULL CHECK (level IN ('Profesjonalny','Półprofesjonalny','Amatorski','Rekreacyjny')),
  condition text NOT NULL CHECK (condition IN ('Nowe z metką','Nowe bez metki','Używane 9/10','Używane 8/10','Używane 7/10','Używane 6/10')),
  condition_detail text,
  images text[] NOT NULL DEFAULT '{}',
  box_included boolean NOT NULL DEFAULT false,
  bag_included boolean NOT NULL DEFAULT false,
  extras_description text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','draft')),
  drop_scheduled_at timestamptz,
  drop_id uuid REFERENCES public.drops(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_method text NOT NULL CHECK (shipping_method IN ('paczkomat','kurier')),
  paczkomat_code text,
  shipping_address text,
  payment_method text NOT NULL CHECK (payment_method IN ('blik','card','apple_pay','google_pay','transfer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','completed','cancelled')),
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_brand_idx ON public.products(brand);
CREATE INDEX IF NOT EXISTS products_status_idx ON public.products(status);
CREATE INDEX IF NOT EXISTS products_size_eu_idx ON public.products(size_eu);
CREATE INDEX IF NOT EXISTS products_drop_id_idx ON public.products(drop_id);
CREATE INDEX IF NOT EXISTS products_drop_scheduled_at_idx ON public.products(drop_scheduled_at) WHERE drop_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS drops_status_idx ON public.drops(status);
CREATE INDEX IF NOT EXISTS drops_scheduled_at_idx ON public.drops(scheduled_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drops TO anon, authenticated;
GRANT ALL ON public.drops TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_products" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_products" ON public.products FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_drops" ON public.drops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_drops" ON public.drops FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_drops" ON public.drops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_drops" ON public.drops FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_select_orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_update_orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.publish_due_drops()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n1 integer := 0;
  n2 integer := 0;
BEGIN
  UPDATE products
  SET status = 'available', drop_scheduled_at = NULL
  WHERE status = 'draft'
    AND drop_id IN (
      SELECT id FROM drops
      WHERE status = 'scheduled' AND scheduled_at <= now()
    );

  GET DIAGNOSTICS n1 = ROW_COUNT;

  UPDATE drops
  SET status = 'published'
  WHERE status = 'scheduled' AND scheduled_at <= now();

  UPDATE products
  SET status = 'available', drop_scheduled_at = NULL
  WHERE status = 'draft'
    AND drop_scheduled_at IS NOT NULL
    AND drop_scheduled_at <= now();

  GET DIAGNOSTICS n2 = ROW_COUNT;

  RETURN n1 + n2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_due_drops() TO anon, authenticated;