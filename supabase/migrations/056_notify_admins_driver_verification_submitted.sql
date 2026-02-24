-- Notifier les admins quand un chauffeur soumet son profil pour validation (documents)
-- Une notification in-app est créée pour chaque utilisateur avec is_admin = true

CREATE OR REPLACE FUNCTION public.notify_admins_driver_verification_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quand le statut passe à 'pending' et la date de soumission est renseignée
  IF (TG_OP = 'UPDATE'
      AND (OLD.driver_verification_status IS DISTINCT FROM 'pending' OR OLD.driver_verification_submitted_at IS DISTINCT FROM NEW.driver_verification_submitted_at)
      AND NEW.driver_verification_status = 'pending'
      AND NEW.driver_verification_submitted_at IS NOT NULL) THEN
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    SELECT u.id, 'driver_verification_submitted', 'Nouveau dossier à vérifier',
           'Un chauffeur a soumis ses documents pour validation.', 'admin_driver_verification'
    FROM public.users u
    WHERE u.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vtc_profiles_notify_admins_submitted ON public.vtc_profiles;
CREATE TRIGGER trg_vtc_profiles_notify_admins_submitted
  AFTER UPDATE ON public.vtc_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_driver_verification_submitted();
