-- =============================================
-- FIX: AUTO-CONFIRMER L'EMAIL DANS auth.users
-- =============================================

-- Le problème : Le trigger handle_new_user insère dans public.users
-- mais ne confirme PAS l'email dans auth.users.
-- Résultat : verification_status = 'VERIFIED' dans public.users
-- mais email_confirmed_at = NULL dans auth.users

-- SOLUTION : Modifier le trigger pour confirmer l'email immédiatement

-- ÉTAPE 1: Supprimer l'ancien trigger
-- ========================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ÉTAPE 2: Créer une nouvelle fonction qui confirme l'email
-- ========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer dans public.users avec statut VERIFIED
  INSERT INTO public.users (
    id,
    supabase_auth_id,
    email,
    full_name,
    verification_status,
    credits,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id::text,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'VERIFIED',  -- ✅ AUTO-VÉRIFIÉ dans public.users
    10,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  
  -- ✅ CONFIRMER L'EMAIL DANS auth.users
  -- Ceci permet à l'utilisateur de se connecter immédiatement
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 3: Réactiver le trigger
-- ========================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 4: Confirmer tous les utilisateurs existants non confirmés
-- ========================================================================

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

UPDATE public.users
SET verification_status = 'VERIFIED'
WHERE verification_status = 'UNVERIFIED';

-- ÉTAPE 5: Vérification
-- ========================================================================

SELECT 
  '✅ Derniers utilisateurs dans auth.users' as info;

SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  '✅ Derniers utilisateurs dans public.users' as info;

SELECT 
  id,
  email,
  full_name,
  verification_status,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

/*
=============================================
RÉSULTAT ATTENDU :
=============================================

✅ Tous les nouveaux utilisateurs auront :
   - email_confirmed_at rempli dans auth.users
   - verification_status = 'VERIFIED' dans public.users

✅ Connexion automatique après inscription

=============================================
TESTE MAINTENANT :
=============================================

1. Exécute ce script dans Supabase SQL Editor
2. Recharge l'app (CMD+R)
3. Crée un nouveau compte (email différent)
4. Tu devrais être connecté automatiquement ! ✅
*/

