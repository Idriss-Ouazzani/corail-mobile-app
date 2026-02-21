-- ============================================================================
-- Migration 022: Ajouter supabase_auth_id (compatibilité Firebase → Supabase)
-- ============================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1️⃣ AJOUTER UNE COLONNE supabase_auth_id
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Cette colonne va stocker l'UUID Supabase Auth
-- Pendant que `id` garde l'ancien Firebase UID (pour la compatibilité)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS supabase_auth_id UUID;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id 
ON public.users(supabase_auth_id);

COMMENT ON COLUMN public.users.supabase_auth_id IS 
  'UUID from Supabase Auth (auth.users). Different from id which may be Firebase UID.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2️⃣ MODIFIER LE TRIGGER POUR UTILISER supabase_auth_id
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
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id::text, -- Pour les nouveaux users, id = UUID Supabase
      NEW.id,       -- supabase_auth_id aussi
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      'UNVERIFIED',
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
-- 3️⃣ METTRE À JOUR apiClient.setUserId()
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Note: Il faudra aussi modifier src/services/api.ts pour utiliser
-- supabase_auth_id au lieu de id pour les requêtes authentifiées

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vérifier que la colonne est bien créée
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'supabase_auth_id';

-- Vérifier le trigger
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

