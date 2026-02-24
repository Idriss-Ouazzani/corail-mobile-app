-- ============================================================================
-- Mettre un profil VTC en "pending" pour tester le panel admin
-- ============================================================================
-- 1. Trouvez un user_id qui a déjà un vtc_profile (avec ou sans documents) :
--    SELECT id, user_id, driver_verification_status FROM vtc_profiles LIMIT 10;
-- 2. Remplacez 'VOTRE_USER_ID_ICI' ci-dessous par un de ces user_id.
-- 3. Exécutez ce script dans Supabase → SQL Editor.
-- ============================================================================

UPDATE public.vtc_profiles
SET
  driver_verification_status = 'pending',
  driver_verification_submitted_at = COALESCE(driver_verification_submitted_at, NOW())
WHERE user_id = 'VOTRE_USER_ID_ICI';

-- Vérifier
SELECT id, user_id, driver_verification_status, driver_verification_submitted_at
FROM public.vtc_profiles
WHERE driver_verification_status = 'pending';
