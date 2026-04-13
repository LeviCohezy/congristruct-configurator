
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (true);

-- Allow service role (edge functions) to insert
CREATE POLICY "Service role can insert submissions"
  ON public.submissions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_submissions_created_at ON public.submissions (created_at DESC);
CREATE INDEX idx_submissions_status ON public.submissions (status);
