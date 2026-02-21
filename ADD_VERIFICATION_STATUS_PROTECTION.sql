-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ PROTECTION: Logger toutes les modifications de verification_status
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Ce script crée un système de logging pour tracer TOUTES les modifications
-- du champ verification_status, pour qu'on puisse identifier la source
-- d'un éventuel problème futur.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 1 : Créer la table de log
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.verification_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by TEXT DEFAULT current_user,
  trigger_source TEXT -- Nom du trigger ou script qui a causé la modification
);

CREATE INDEX IF NOT EXISTS idx_verification_log_user_id 
ON public.verification_status_log(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_log_changed_at 
ON public.verification_status_log(changed_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 2 : Créer la fonction de logging
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.log_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger seulement si verification_status a changé
  IF (TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
    INSERT INTO public.verification_status_log (
      user_id, 
      user_email, 
      old_status, 
      new_status, 
      trigger_source
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      OLD.verification_status, 
      NEW.verification_status,
      TG_NAME || ' (UPDATE)'
    );
    
    RAISE NOTICE '⚠️ [LOG] Verification status changé pour %: % → %', 
      NEW.email, OLD.verification_status, NEW.verification_status;
  END IF;
  
  -- Logger aussi les INSERT avec verification_status
  IF (TG_OP = 'INSERT' AND NEW.verification_status IS NOT NULL) THEN
    INSERT INTO public.verification_status_log (
      user_id, 
      user_email, 
      old_status, 
      new_status, 
      trigger_source
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      NULL, 
      NEW.verification_status,
      TG_NAME || ' (INSERT)'
    );
    
    RAISE NOTICE '✅ [LOG] Nouveau user créé %: verification_status = %', 
      NEW.email, NEW.verification_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ÉTAPE 3 : Créer le trigger de logging
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TRIGGER IF EXISTS log_verification_changes ON public.users;

CREATE TRIGGER log_verification_changes
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.log_verification_status_change();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ VÉRIFICATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Voir tous les triggers sur la table users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 UTILISATION FUTURE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Pour voir l'historique des modifications de verification_status :
-- SELECT * FROM public.verification_status_log 
-- ORDER BY changed_at DESC;

-- Pour voir les modifications d'un user spécifique :
-- SELECT * FROM public.verification_status_log 
-- WHERE user_email = 'mydrissouazzani@gmail.com'
-- ORDER BY changed_at DESC;

-- Pour voir combien de users ont été affectés :
-- SELECT 
--   old_status, 
--   new_status, 
--   COUNT(*) as count,
--   MIN(changed_at) as first_change,
--   MAX(changed_at) as last_change
-- FROM public.verification_status_log
-- GROUP BY old_status, new_status
-- ORDER BY last_change DESC;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎯 RÉSULTAT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Maintenant, TOUTES les modifications de verification_status seront loggées
-- On pourra identifier la source exacte du problème si ça se reproduit.

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

