INSERT INTO storage.buckets (id, name, public) VALUES ('quote-pdfs', 'quote-pdfs', true);

CREATE POLICY "Public read access for quote PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-pdfs');

CREATE POLICY "Service role can upload quote PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-pdfs');