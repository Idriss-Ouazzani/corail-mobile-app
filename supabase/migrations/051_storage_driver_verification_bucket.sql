-- ============================================================================
-- Migration 051: Bucket Storage "driver-verification" + RLS
-- ============================================================================
-- Chemins: {user_id}/{doc_type}/{filename}
-- doc_type: vtc_card | id_card | insurance
-- RLS: utilisateur peut upload/read ses fichiers; admins peuvent read tout.
-- ============================================================================

-- Créer le bucket (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-verification',
  'driver-verification',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS sur storage.objects pour le bucket driver-verification
-- Chemin: {user_id}/{doc_type}/{filename} avec user_id = public.users.id
-- Utilisateur peut SELECT/INSERT/UPDATE ses propres fichiers
DROP POLICY IF EXISTS "Users can read own verification docs" ON storage.objects;
CREATE POLICY "Users can read own verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-verification'
  AND (storage.foldername(name))[1] = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
);

DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
CREATE POLICY "Users can upload own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-verification'
  AND (storage.foldername(name))[1] = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
);

DROP POLICY IF EXISTS "Users can update own verification docs" ON storage.objects;
CREATE POLICY "Users can update own verification docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'driver-verification'
  AND (storage.foldername(name))[1] = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
);

-- Admins peuvent tout lire (pour review)
DROP POLICY IF EXISTS "Admins can read all verification docs" ON storage.objects;
CREATE POLICY "Admins can read all verification docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-verification'
  AND EXISTS (
    SELECT 1 FROM public.users u
    WHERE (u.supabase_auth_id = auth.uid() OR u.id = auth.uid()::text) AND u.is_admin = true
  )
);
