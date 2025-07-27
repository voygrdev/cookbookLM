-- Enable Storage by creating the necessary bucket and policies
-- Create a storage bucket for PDF files
INSERT INTO storage.buckets (id, name)
VALUES ('pdfs', 'pdfs')
ON CONFLICT DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Enable read access for authenticated users"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdfs' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Enable insert access for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdfs'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Enable update access for authenticated users"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pdfs'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'pdfs'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Enable delete access for authenticated users"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdfs'
  AND auth.role() = 'authenticated'
);