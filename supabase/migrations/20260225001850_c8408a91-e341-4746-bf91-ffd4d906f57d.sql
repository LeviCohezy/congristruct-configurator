
-- Table to store interior image references per BLOQ model combination
CREATE TABLE public.interior_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model TEXT NOT NULL,          -- start, flow, hub, base
  plan TEXT NOT NULL,            -- a, b
  finish_level TEXT NOT NULL,    -- shell, finished, fully-finished
  floor_option TEXT,             -- light-vinyl, dark-vinyl, stone-vinyl (null for shell)
  kast_color TEXT,               -- brown, light-oak, white (null for shell/finished)
  image1_url TEXT,               -- URL/path for first image
  image2_url TEXT,               -- URL/path for second image
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model, plan, finish_level, floor_option, kast_color)
);

-- Public read access (no auth needed for configurator)
ALTER TABLE public.interior_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read interior images"
  ON public.interior_images FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert interior images"
  ON public.interior_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update interior images"
  ON public.interior_images FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete interior images"
  ON public.interior_images FOR DELETE
  USING (true);

-- Storage bucket for interior images
INSERT INTO storage.buckets (id, name, public) VALUES ('interior-images', 'interior-images', true);

CREATE POLICY "Anyone can view interior images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'interior-images');

CREATE POLICY "Anyone can upload interior images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'interior-images');

CREATE POLICY "Anyone can update interior images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'interior-images');

CREATE POLICY "Anyone can delete interior images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'interior-images');
