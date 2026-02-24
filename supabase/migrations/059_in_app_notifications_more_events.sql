-- Notifications in-app : événements supplémentaires
-- - ride_cancelled : le créateur annule → notifier le chauffeur (picker)
-- - verification_rejected : admin rejette le profil chauffeur → notifier l'utilisateur
-- - group_invitation : invitation à un groupe → notifier l'invité

-- =============================================================================
-- 1) Course annulée : notifier le chauffeur (picker)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.insert_in_app_notification_for_ride_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id TEXT;
  v_picker_id TEXT;
  v_ride_id TEXT;
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  v_ride_id := NEW.id;
  v_creator_id := NEW.creator_id;
  v_picker_id := NEW.picker_id;

  -- Course réclamée -> notifier le créateur
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'CLAIMED' AND NEW.status = 'CLAIMED') THEN
    v_type := 'ride_claimed';
    v_title := 'Course prise';
    v_body := 'Quelqu''un a pris votre course.';
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_ride_id)
    VALUES (v_creator_id, v_type, v_title, v_body, v_ride_id);
    RETURN NEW;
  END IF;

  -- Course terminée -> notifier le créateur
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'COMPLETED' AND NEW.status = 'COMPLETED') THEN
    v_type := 'ride_completed';
    v_title := 'Course terminée';
    v_body := 'La course a été marquée comme terminée.';
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_ride_id)
    VALUES (v_creator_id, v_type, v_title, v_body, v_ride_id);
    RETURN NEW;
  END IF;

  -- Course annulée -> notifier le chauffeur (picker) s'il y en avait un
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'CANCELLED' AND NEW.status = 'CANCELLED' AND v_picker_id IS NOT NULL AND v_picker_id <> '') THEN
    v_type := 'ride_cancelled';
    v_title := 'Course annulée';
    v_body := 'La course a été annulée par le créateur.';
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_ride_id)
    VALUES (v_picker_id, v_type, v_title, v_body, v_ride_id);
    RETURN NEW;
  END IF;

  -- Notation reçue -> notifier le créateur
  IF (TG_OP = 'UPDATE' AND (OLD.rating_by_picker_at IS NULL OR OLD.rating_by_picker_at IS DISTINCT FROM NEW.rating_by_picker_at) AND NEW.rating_by_picker_at IS NOT NULL) THEN
    v_type := 'ride_rating';
    v_title := 'Nouvelle notation';
    v_body := 'Le chauffeur vous a laissé une note.';
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_ride_id)
    VALUES (v_creator_id, v_type, v_title, v_body, v_ride_id);
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 2) Profil chauffeur rejeté : notifier l'utilisateur
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_user_driver_verification_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_body TEXT;
BEGIN
  IF (TG_OP = 'UPDATE'
      AND (OLD.driver_verification_status IS DISTINCT FROM 'rejected')
      AND NEW.driver_verification_status = 'rejected') THEN
    v_body := COALESCE(NULLIF(TRIM(NEW.driver_verification_rejection_reason), ''), 'Votre dossier a été refusé. Vous pouvez corriger et resoumettre.');
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (
      NEW.user_id,
      'verification_rejected',
      'Dossier refusé',
      v_body,
      'driver_verification_profile'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vtc_profiles_notify_user_rejected ON public.vtc_profiles;
CREATE TRIGGER trg_vtc_profiles_notify_user_rejected
  AFTER UPDATE ON public.vtc_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_driver_verification_rejected();

-- =============================================================================
-- 3) Invitation à un groupe : notifier l'invité (si déjà inscrit, invitee_id renseigné)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_user_group_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_inviter_name TEXT;
  v_body TEXT;
BEGIN
  IF (NEW.invitee_id IS NULL OR NEW.status <> 'PENDING') THEN
    RETURN NEW;
  END IF;
  SELECT g.name INTO v_group_name FROM public.groups g WHERE g.id = NEW.group_id;
  SELECT u.full_name INTO v_inviter_name FROM public.users u WHERE u.id = NEW.inviter_id;
  v_group_name := COALESCE(v_group_name, 'Un groupe');
  v_inviter_name := COALESCE(NULLIF(TRIM(v_inviter_name), ''), 'Quelqu''un');
  v_body := v_inviter_name || ' vous invite à rejoindre « ' || v_group_name || ' ».';
  INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
  VALUES (
    NEW.invitee_id,
    'group_invitation',
    'Invitation à un groupe',
    v_body,
    'group_invitations'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_invitations_notify_invitee ON public.group_invitations;
CREATE TRIGGER trg_group_invitations_notify_invitee
  AFTER INSERT ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_group_invitation();
