
-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-pdfs', 'note-pdfs', true);

-- RLS policies for the bucket
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'note-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'note-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'note-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add PDF columns to notes table
ALTER TABLE public.notes ADD COLUMN pdf_url text DEFAULT NULL;
ALTER TABLE public.notes ADD COLUMN annotations jsonb DEFAULT '[]'::jsonb;
