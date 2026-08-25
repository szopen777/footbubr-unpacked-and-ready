CREATE TABLE IF NOT EXISTS public.drop_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid REFERENCES public.drops(id) ON DELETE SET NULL,
  contact text NOT NULL,
  type text NOT NULL CHECK (type IN ('email','phone')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drop_alerts_drop_id_idx ON public.drop_alerts(drop_id);

GRANT INSERT ON public.drop_alerts TO anon, authenticated;
GRANT SELECT ON public.drop_alerts TO authenticated;
GRANT ALL ON public.drop_alerts TO service_role;

ALTER TABLE public.drop_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_subscribe" ON public.drop_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated_can_read_alerts" ON public.drop_alerts FOR SELECT TO authenticated USING (true);