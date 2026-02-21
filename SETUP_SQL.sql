-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚗 CONFIGURATION SYSTÈME DE NOTIFICATIONS CORAIL
-- À exécuter dans le SQL Editor de Supabase
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1️⃣ AJOUTER LA COLONNE POUR LES TOKENS PUSH
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token 
ON public.users(expo_push_token) 
WHERE expo_push_token IS NOT NULL;

COMMENT ON COLUMN public.users.expo_push_token IS 
  'Token Expo Push Notifications (format: ExponentPushToken[XXXXXX])';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2️⃣ ACTIVER REALTIME SUR LA TABLE RIDES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier si déjà activé, sinon l'activer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rides;
    RAISE NOTICE '✅ Realtime activé sur table rides';
  ELSE
    RAISE NOTICE '✓ Realtime déjà activé sur table rides';
  END IF;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3️⃣ VÉRIFICATION (OPTIONNEL)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que Realtime est bien activé
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'rides';
-- ✅ Tu devrais voir : public | rides

-- Vérifier la colonne expo_push_token
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'expo_push_token';
-- ✅ Tu devrais voir : expo_push_token | text

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ C'EST TOUT ! Configuration terminée
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Prochaines étapes :
-- 1. Installer les dépendances : npx expo install expo-av expo-notifications
-- 2. Redémarrer l'app
-- 3. Tester en créant une course depuis un autre compte

