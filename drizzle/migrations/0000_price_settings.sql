CREATE TABLE IF NOT EXISTS public.price_settings (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.price_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.price_settings TO authenticated;
GRANT ALL ON public.price_settings TO service_role;
ALTER TABLE public.price_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prices are readable by everyone" ON public.price_settings FOR SELECT USING (true);
CREATE POLICY "Editors can insert prices" ON public.price_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Editors can update prices" ON public.price_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);