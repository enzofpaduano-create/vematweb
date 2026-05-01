-- ─────────────────────────────────────────────────────────────────────────────
-- Vemat Forms v2 — Migration SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add machine_year column to form_interventions
ALTER TABLE form_interventions
  ADD COLUMN IF NOT EXISTS machine_year TEXT;

-- 2. Add attachments column to form_interventions (array of public URLs)
ALTER TABLE form_interventions
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Supabase Storage — Create bucket "intervention-files"
--
-- Do this in Storage → New bucket (Dashboard UI):
--   Name: intervention-files
--   Public bucket: YES (so files can be previewed via public URL)
--
-- Then add the following storage policy so anonymous users can upload:
-- ─────────────────────────────────────────────────────────────────────────────

-- Storage RLS policy for anonymous uploads (run in SQL Editor):
INSERT INTO storage.buckets (id, name, public)
VALUES ('intervention-files', 'intervention-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to upload (INSERT) to the bucket
DROP POLICY IF EXISTS "anon can upload intervention files" ON storage.objects;
CREATE POLICY "anon can upload intervention files"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'intervention-files');

-- Allow anyone to read (SELECT) from the bucket
DROP POLICY IF EXISTS "public read intervention files" ON storage.objects;
CREATE POLICY "public read intervention files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'intervention-files');
