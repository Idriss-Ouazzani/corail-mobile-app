-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🚀 FIX: Ajouter has_accepted_terms pour le flux d'inscription
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script ajoute le champ has_accepted_terms manquant et met à jour le trigger
-- pour que les nouveaux utilisateurs aient le bon flux d'inscription :
-- 1. VerificationScreen (si UNVERIFIED)
-- 2. ConsentScreen (si !has_accepted_terms)
-- 3. App normale
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Ajouter la colonne has_accepted_terms
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE;

-- 2️⃣ Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_has_accepted_terms 
ON public.users(has_accepted_terms);

-- 3️⃣ Mettre à jour tous les utilisateurs VERIFIED existants pour qu'ils aient accepté les termes
-- (pour éviter qu'ils soient bloqués sur le ConsentScreen)
UPDATE public.users
SET has_accepted_terms = TRUE
WHERE verification_status = 'VERIFIED';

-- 4️⃣ Mettre à jour le trigger handle_new_user() pour inclure has_accepted_terms
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Vérifier si un user avec cet email existe déjà dans public.users
  SELECT * INTO existing_user
  FROM public.users
  WHERE email = NEW.email
  LIMIT 1;
  
  IF existing_user.id IS NOT NULL THEN
    -- User existe déjà (ancien Firebase user migrant vers Supabase)
    -- On garde l'ancien ID, mais on ajoute le supabase_auth_id
    UPDATE public.users
    SET 
      supabase_auth_id = NEW.id, -- UUID Supabase
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      updated_at = NOW()
    WHERE email = NEW.email;
    
    RAISE NOTICE '✅ User existant migré: % (Firebase ID: % → Supabase ID: %)', 
      NEW.email, existing_user.id, NEW.id;
  ELSE
    -- Nouveau user : id = supabase_auth_id
    INSERT INTO public.users (
      id, 
      supabase_auth_id,
      email, 
      full_name, 
      verification_status,
      has_accepted_terms, -- ✅ Ajouté !
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id::text, -- Pour les nouveaux users, id = UUID Supabase
      NEW.id,       -- supabase_auth_id aussi
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'UNVERIFIED', -- ✅ Par défaut : non vérifié → affiche VerificationScreen
      FALSE,        -- ✅ Par défaut : n'a pas accepté les termes → affiche ConsentScreen après VerificationScreen
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Nouveau user créé: % (ID: %) avec verification_status=UNVERIFIED et has_accepted_terms=FALSE', NEW.email, NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur handle_new_user pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la colonne est bien créée
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'has_accepted_terms';

-- Vérifier que les users VERIFIED ont bien has_accepted_terms = TRUE
SELECT 
  email,
  verification_status,
  has_accepted_terms
FROM public.users
WHERE verification_status = 'VERIFIED'
LIMIT 5;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Après avoir exécuté ce script :
-- 1. Les nouveaux utilisateurs auront verification_status='UNVERIFIED' et has_accepted_terms=FALSE
-- 2. Ils verront d'abord le VerificationScreen (pour soumettre leur carte VTC)
-- 3. Après soumission, leur statut passera à 'PENDING'
-- 4. Ils verront la bannière de validation en attente dans l'app
-- 5. Après validation par l'admin, leur statut passera à 'VERIFIED'
-- 6. Ils pourront alors accéder à la marketplace
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

