/**
 * Migration: Ajouter colonne expo_push_token pour notifications push
 * 
 * Cette colonne stocke le token Expo Push Notifications de chaque utilisateur
 * pour envoyer des notifications quand l'app est fermée
 */

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1) Ajouter la colonne expo_push_token
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token 
ON public.users(expo_push_token) 
WHERE expo_push_token IS NOT NULL;

COMMENT ON COLUMN public.users.expo_push_token IS 
  'Token Expo Push Notifications pour envoyer des notifications quand l''app est fermée';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2) Politique RLS : Les utilisateurs peuvent mettre à jour leur propre token
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier si la politique existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update their own push token'
  ) THEN
    CREATE POLICY "Users can update their own push token"
      ON public.users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

COMMENT ON POLICY "Users can update their own push token" ON public.users IS
  'Permet aux utilisateurs de mettre à jour leur propre token push';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3) Fonction helper pour nettoyer les anciens tokens (optionnel)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprime les tokens des utilisateurs non connectés depuis 30 jours
CREATE OR REPLACE FUNCTION public.clean_old_push_tokens()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET expo_push_token = NULL
  WHERE expo_push_token IS NOT NULL
  AND last_sign_in_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.clean_old_push_tokens IS
  'Supprime les tokens push des utilisateurs inactifs (>30 jours)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTES :
-- 
-- Les tokens Expo Push suivent le format : ExponentPushToken[XXXXXX]
-- Un utilisateur peut avoir plusieurs appareils → un seul token actif à la fois
-- Les tokens peuvent expirer → ils sont automatiquement régénérés par l'app
-- 
-- Pour tester :
-- SELECT id, full_name, expo_push_token FROM users WHERE expo_push_token IS NOT NULL;
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

