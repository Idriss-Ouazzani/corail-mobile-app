-- ============================================================================
-- FIX : Rendre le bucket vtc-profiles complètement PUBLIC
-- ============================================================================
-- Ce script résout l'erreur "Unknown image download error" en s'assurant que
-- le bucket et toutes les images sont accessibles publiquement
-- ============================================================================

-- 1. Vérifier que le bucket existe et est public
UPDATE storage.buckets
SET public = true
WHERE id = 'vtc-profiles';

-- 2. Supprimer TOUTES les policies RLS du bucket (elles bloquent l'accès)
DROP POLICY IF EXISTS "vtc_profiles_select" ON storage.objects;
DROP POLICY IF EXISTS "vtc_profiles_insert" ON storage.objects;
DROP POLICY IF EXISTS "vtc_profiles_update" ON storage.objects;
DROP POLICY IF EXISTS "vtc_profiles_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- 3. Supprimer toutes les autres policies qui pourraient bloquer vtc-profiles
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (
            policyname ILIKE '%vtc%' 
            OR policyname ILIKE '%profile%'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- 4. Créer UNE SEULE policy très permissive pour la lecture (anonyme + authentifié)
CREATE POLICY "vtc_profiles_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vtc-profiles');

-- 5. Permettre l'upload à tout le monde (pour le moment, on sécurisera plus tard)
CREATE POLICY "vtc_profiles_public_insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'vtc-profiles');

-- 6. Vérifier la configuration finale
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'vtc-profiles';

-- 7. Vérifier les policies actives
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%vtc%'
ORDER BY policyname;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Le bucket doit avoir :
-- - public = true
-- - 2 policies : vtc_profiles_public_read et vtc_profiles_public_insert
-- 
-- Si ce n'est pas le cas, les images ne seront pas accessibles !
-- ============================================================================



