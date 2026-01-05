-- ============================================================================
-- DEBUG: Vérifier et corriger les politiques RLS pour quotes
-- ============================================================================

-- 1. Afficher les politiques actuelles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quotes';

-- 2. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "quotes_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_select_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy" ON quotes;
DROP POLICY IF EXISTS "public_quotes_read" ON quotes;
DROP POLICY IF EXISTS "Enable read access for all users" ON quotes;

-- 3. S'assurer que RLS est activé
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- 4. Créer UNE SEULE politique ultra-permissive pour debug
CREATE POLICY "quotes_all_access_policy" ON quotes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Vérifier les nouvelles politiques
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'quotes';

-- 6. Tester la création d'un devis (remplacez VOTRE_USER_ID par votre vrai ID)
-- Décommentez et remplacez pour tester :
-- INSERT INTO quotes (
--   driver_id,
--   client_name,
--   client_phone,
--   pickup_address,
--   dropoff_address,
--   scheduled_date,
--   scheduled_time,
--   price_cents,
--   status,
--   sent_at
-- ) VALUES (
--   'VOTRE_USER_ID',
--   'Test Client',
--   '0612345678',
--   'Test Départ',
--   'Test Arrivée',
--   '2026-01-02',
--   '10:00:00',
--   4500,
--   'SENT',
--   NOW()
-- ) RETURNING *;

-- 7. Tester la lecture des devis (remplacez VOTRE_USER_ID)
-- SELECT * FROM quotes WHERE driver_id = 'VOTRE_USER_ID';

-- 8. Compter tous les devis
SELECT COUNT(*) as total_quotes FROM quotes;

-- 9. Afficher les 10 derniers devis
SELECT 
  id,
  driver_id,
  client_name,
  scheduled_date,
  status,
  created_at
FROM quotes 
ORDER BY created_at DESC 
LIMIT 10;

