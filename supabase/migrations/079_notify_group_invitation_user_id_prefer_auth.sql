-- ============================================================================
-- 079 : Invitation groupe — user_id in_app = supabase_auth_id si dispo (comme 077)
-- ============================================================================
-- Évite que l’inviteur voie la ligne (IDs legacy vs auth) et aligne cloche / liste / push.

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
  v_notify_invitee TEXT;
  v_notify_inviter TEXT;
BEGIN
  IF (NEW.invitee_id IS NULL OR NEW.status <> 'PENDING') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(u.supabase_auth_id::text, ''), u.id::text) INTO v_notify_invitee
  FROM public.users u
  WHERE u.id = NEW.invitee_id
     OR u.supabase_auth_id::text = NEW.invitee_id::text
  LIMIT 1;
  IF v_notify_invitee IS NULL THEN
    v_notify_invitee := NEW.invitee_id::text;
  END IF;

  SELECT COALESCE(NULLIF(u.supabase_auth_id::text, ''), u.id::text) INTO v_notify_inviter
  FROM public.users u
  WHERE u.id = NEW.inviter_id
     OR u.supabase_auth_id::text = NEW.inviter_id::text
  LIMIT 1;
  IF v_notify_inviter IS NULL THEN
    v_notify_inviter := NEW.inviter_id::text;
  END IF;

  -- Même personne (auto-invitation / mauvaise saisie) : pas de notification in-app
  IF v_notify_invitee = v_notify_inviter THEN
    RETURN NEW;
  END IF;

  SELECT g.name INTO v_group_name FROM public.groups g WHERE g.id = NEW.group_id;
  SELECT u.full_name INTO v_inviter_name
  FROM public.users u
  WHERE u.id = NEW.inviter_id OR u.supabase_auth_id::text = NEW.inviter_id::text
  LIMIT 1;

  v_group_name := COALESCE(v_group_name, 'Un groupe');
  v_inviter_name := COALESCE(NULLIF(TRIM(v_inviter_name), ''), 'Quelqu''un');
  v_body := v_inviter_name || ' vous invite à rejoindre « ' || v_group_name || ' ».';

  INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
  VALUES (
    v_notify_invitee,
    'group_invitation',
    'Invitation à un groupe',
    v_body,
    'group_invitations'
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_user_group_invitation() IS
  'INSERT group_invitation : notif in-app pour l’invité uniquement, user_id = auth UUID si disponible.';
