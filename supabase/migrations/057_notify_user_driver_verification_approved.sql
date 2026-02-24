-- Quand un admin approuve le profil chauffeur (documents), insérer une notification in-app
-- pour que l'utilisateur la voie dans la cloche (et en grisé une fois consultée)

CREATE OR REPLACE FUNCTION public.notify_user_driver_verification_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE'
      AND (OLD.driver_verification_status IS DISTINCT FROM 'approved')
      AND NEW.driver_verification_status = 'approved') THEN
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (
      NEW.user_id,
      'verification_approved',
      'Profil vérifié',
      'Votre profil professionnel a été vérifié. Vous avez accès au marketplace.',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vtc_profiles_notify_user_approved ON public.vtc_profiles;
CREATE TRIGGER trg_vtc_profiles_notify_user_approved
  AFTER UPDATE ON public.vtc_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_driver_verification_approved();
