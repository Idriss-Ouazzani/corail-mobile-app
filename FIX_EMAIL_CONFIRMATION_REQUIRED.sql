-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Désactiver la confirmation d'email Supabase Auth
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script confirme automatiquement tous les emails et permet de se connecter
-- immédiatement après l'inscription sans attendre l'email de confirmation.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Créer une fonction pour auto-confirmer les nouveaux users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmer l'email (confirmed_at est une colonne générée, pas besoin de la mettre à jour)
  NEW.email_confirmed_at = NOW();
  
  RAISE NOTICE '✅ Email auto-confirmé pour: %', NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Créer le trigger AVANT l'insertion dans auth.users
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;

CREATE TRIGGER auto_confirm_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- 3️⃣ Confirmer tous les users existants qui ne sont pas encore confirmés
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que le trigger existe
SELECT 
  trigger_name, 
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'auto_confirm_users_trigger';

-- Vérifier que tous les users sont confirmés
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Après avoir exécuté ce script :
-- 1. Les nouveaux users seront automatiquement confirmés à l'inscription
-- 2. Ils pourront se connecter immédiatement sans cliquer sur un lien d'email
-- 3. Tous les users existants seront également confirmés
--
-- ⚠️ ATTENTION : En production, vous voudrez peut-être réactiver la confirmation
-- d'email pour plus de sécurité. Pour ça :
-- 1. Supprimer le trigger : DROP TRIGGER auto_confirm_users_trigger ON auth.users;
-- 2. Supprimer la fonction : DROP FUNCTION public.auto_confirm_user();
-- 3. Réactiver la confirmation d'email dans Dashboard > Auth > Settings
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

