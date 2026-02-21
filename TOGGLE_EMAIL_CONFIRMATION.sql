-- =============================================
-- BASCULER ENTRE AUTO-CONFIRMATION ET EMAIL CONFIRMATION
-- =============================================

-- 🔀 CHOISIR LE MODE :
-- MODE 1 : AUTO-CONFIRMATION (Dev/Beta)
-- MODE 2 : EMAIL CONFIRMATION (Production)

-- =============================================
-- MODE 1 : AUTO-CONFIRMATION (Dev/Beta)
-- =============================================
-- ✅ Users créés et vérifiés immédiatement
-- ✅ Pas d'email envoyé
-- ✅ Parfait pour les tests

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    'VERIFIED',  -- ✅ AUTO-VÉRIFIÉ
    10,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirmer tous les users existants
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
UPDATE public.users SET verification_status = 'VERIFIED' WHERE verification_status = 'UNVERIFIED';
*/

-- =============================================
-- MODE 2 : EMAIL CONFIRMATION (Production)
-- =============================================
-- ✅ Users doivent confirmer leur email
-- ✅ Email envoyé via SMTP custom (Resend/Gmail)
-- ✅ Sécurisé pour la production

/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    'UNVERIFIED',  -- ✅ NON VÉRIFIÉ (attente confirmation email)
    10,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    supabase_auth_id = EXCLUDED.supabase_auth_id,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- =============================================
-- INSTRUCTIONS :
-- =============================================

/*
📝 POUR ACTIVER AUTO-CONFIRMATION (Dev) :
==========================================
1. Décommente le bloc "MODE 1" ci-dessus (lignes 11-45)
2. Exécute le script
3. Dans Supabase Dashboard :
   - Authentication → Email → "Confirm sign up" → DÉSACTIVER (optionnel)

📝 POUR ACTIVER EMAIL CONFIRMATION (Prod) :
===========================================
1. Configure d'abord un SMTP custom (Resend/Gmail) dans Supabase
2. Décommente le bloc "MODE 2" ci-dessus (lignes 50-83)
3. Exécute le script
4. Dans Supabase Dashboard :
   - Authentication → Email → "Confirm sign up" → ACTIVER
   - Vérifie que le SMTP est bien configuré

⚠️ IMPORTANT :
==============
- Ne change PAS entre les modes en production sans planification
- Les users existants gardent leur statut de vérification
- Teste toujours dans un environnement de staging d'abord
*/

