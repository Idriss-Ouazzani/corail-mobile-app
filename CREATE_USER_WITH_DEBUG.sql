-- =============================================
-- CRÉER UN UTILISATEUR AVEC DEBUG DÉTAILLÉ
-- =============================================

-- ⚠️ PERSONNALISE CES VALEURS :
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  user_email text := 'sabrine@corail.com';     -- ← Ton email
  user_password text := 'test123456';          -- ← Ton mot de passe
  user_full_name text := 'Sabrine Arouf';      -- ← Ton nom
  existing_auth_user_count integer;
  existing_public_user_count integer;
BEGIN
  -- DEBUG 1: Vérifier si l'email existe déjà
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'DEBUG: Vérification email existant...';
  
  SELECT COUNT(*) INTO existing_auth_user_count
  FROM auth.users WHERE email = user_email;
  
  SELECT COUNT(*) INTO existing_public_user_count
  FROM public.users WHERE email = user_email;
  
  IF existing_auth_user_count > 0 THEN
    RAISE NOTICE '⚠️ L''email % existe DÉJÀ dans auth.users', user_email;
    RAISE NOTICE '💡 Solution: Change l''email ou supprime l''ancien utilisateur';
    RETURN;
  END IF;
  
  IF existing_public_user_count > 0 THEN
    RAISE NOTICE '⚠️ L''email % existe DÉJÀ dans public.users', user_email;
    RAISE NOTICE '💡 Solution: Change l''email ou supprime l''ancien utilisateur';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Email % est disponible', user_email;
  RAISE NOTICE '═══════════════════════════════════════';
  
  -- DEBUG 2: Créer l'utilisateur dans auth.users
  RAISE NOTICE 'Étape 1: Création dans auth.users...';
  
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      reauthentication_token,
      banned_until,
      confirmation_sent_at,
      recovery_sent_at,
      email_change_sent_at,
      phone_change_sent_at,
      reauthentication_sent_at,
      email_change_token_current,
      email_change_confirm_status
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', user_full_name),
      FALSE,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      NULL,
      NULL,
      '',
      '',
      '',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      '',
      0
    );
    
    RAISE NOTICE '✅ Utilisateur créé dans auth.users avec ID: %', new_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR lors de la création dans auth.users:';
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
    RAISE NOTICE 'Message: %', SQLERRM;
    RETURN;
  END;
  
  -- DEBUG 3: Créer l'utilisateur dans public.users
  RAISE NOTICE 'Étape 2: Création dans public.users...';
  
  BEGIN
    INSERT INTO public.users (
      id,
      supabase_auth_id,
      email,
      full_name,
      verification_status,
      is_admin,
      credits,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id::text,
      new_user_id,
      user_email,
      user_full_name,
      'VERIFIED',
      FALSE,
      10,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Utilisateur créé dans public.users';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERREUR lors de la création dans public.users:';
    RAISE NOTICE 'Code erreur: %', SQLSTATE;
    RAISE NOTICE 'Message: %', SQLERRM;
    
    -- Rollback: supprimer de auth.users
    DELETE FROM auth.users WHERE id = new_user_id;
    RAISE NOTICE '🔄 Rollback: utilisateur supprimé de auth.users';
    RETURN;
  END;
  
  -- DEBUG 4: Succès !
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🎉 SUCCÈS ! UTILISATEUR CRÉÉ !';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '📧 Email: %', user_email;
  RAISE NOTICE '🔑 Mot de passe: %', user_password;
  RAISE NOTICE '👤 Nom: %', user_full_name;
  RAISE NOTICE '🆔 ID: %', new_user_id;
  RAISE NOTICE '💰 Crédits: 10';
  RAISE NOTICE '✅ Statut: VERIFIED';
  RAISE NOTICE '═══════════════════════════════════════';

END $$;

-- Vérification finale
SELECT 
  '✅ Utilisateurs créés aujourd''hui dans auth.users' as info;

SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE created_at > '2026-01-24 00:00:00'
ORDER BY created_at DESC;

SELECT 
  '✅ Utilisateurs créés aujourd''hui dans public.users' as info;

SELECT 
  id,
  email,
  full_name,
  verification_status,
  credits,
  created_at
FROM public.users
WHERE created_at > '2026-01-24 00:00:00'
ORDER BY created_at DESC;

