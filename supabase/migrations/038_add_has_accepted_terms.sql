-- ============================================================================
-- Migration 027: Ajouter has_accepted_terms pour le RGPD
-- ============================================================================

-- Ajouter la colonne has_accepted_terms (par défaut FALSE pour les nouveaux users)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT FALSE;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_has_accepted_terms 
ON public.users(has_accepted_terms);

COMMENT ON COLUMN public.users.has_accepted_terms IS 
  'Indicates whether the user has accepted the Terms of Service and Privacy Policy (RGPD compliance)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Mettre à jour le trigger handle_new_user() pour inclure has_accepted_terms
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
      has_accepted_terms, -- Ajouté !
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id::text, -- Pour les nouveaux users, id = UUID Supabase
      NEW.id,       -- supabase_auth_id aussi
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'UNVERIFIED', -- Par défaut : non vérifié
      FALSE,        -- Par défaut : n'a pas accepté les termes
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Nouveau user créé: % (ID: %)', NEW.email, NEW.id;
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

