-- =============================================
-- RÉINITIALISER LE MOT DE PASSE D'UN UTILISATEUR
-- =============================================

-- ⚠️ CHANGE l'email et le nouveau mot de passe ci-dessous

DO $$
DECLARE
  user_email text := 'mydrissouazzani@gmail.com';  -- ← CHANGE ICI
  new_password text := 'NewPassword123!';           -- ← CHANGE ICI
BEGIN
  -- Mettre à jour le mot de passe
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE email = user_email;
  
  RAISE NOTICE '✅ Mot de passe réinitialisé pour: %', user_email;
  RAISE NOTICE '🔑 Nouveau mot de passe: %', new_password;
  RAISE NOTICE '📧 Tu peux maintenant te connecter avec ces identifiants !';
END $$;

-- Vérification
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email = 'mydrissouazzani@gmail.com';  -- ← CHANGE ICI

/*
INSTRUCTIONS :
=============
1. Change l'email (ligne 8) par celui que tu veux réinitialiser
2. Change le nouveau mot de passe (ligne 9)
3. Exécute le script
4. Connecte-toi dans l'app avec le nouveau mot de passe !
*/

