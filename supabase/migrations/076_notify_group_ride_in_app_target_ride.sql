-- ============================================================================
-- 076 : Notif cloche « course groupe » — target_ride_id + destinataire = users.id
-- ============================================================================
-- Améliore notify_group_members_new_ride (060) pour :
-- - Lier la course (tap → détail possible, pastille cohérente)
-- - Joindre public.users afin que user_id soit toujours l’id canonique (legacy / auth)

CREATE OR REPLACE FUNCTION public.notify_group_members_new_ride()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_group_name TEXT;
  v_body TEXT;
  v_creator_pk TEXT;
BEGIN
  IF (TG_OP <> 'INSERT') OR (NEW.visibility <> 'GROUP') OR (NEW.group_id IS NULL OR NEW.group_id = '') THEN
    RETURN NEW;
  END IF;

  SELECT c.id INTO v_creator_pk
  FROM public.users c
  WHERE c.id = NEW.creator_id OR c.supabase_auth_id::text = NEW.creator_id
  LIMIT 1;
  IF v_creator_pk IS NULL THEN
    v_creator_pk := NEW.creator_id;
  END IF;

  SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id LIMIT 1;
  v_group_name := COALESCE(v_group_name, 'le groupe');
  v_body := 'Une nouvelle course a été publiée dans « ' || v_group_name || ' ».';

  FOR v_member IN
    SELECT DISTINCT u.id AS notify_user_id
    FROM public.group_members gm
    INNER JOIN public.users u
      ON u.id = gm.user_id OR u.supabase_auth_id::text = gm.user_id
    WHERE gm.group_id = NEW.group_id
      AND gm.user_id IS NOT NULL
      AND gm.user_id <> ''
      AND u.id IS DISTINCT FROM v_creator_pk
  LOOP
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen, target_ride_id)
    VALUES (
      v_member.notify_user_id,
      'ride_in_group',
      'Nouvelle course dans un groupe',
      v_body,
      'marketplace_groups',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_group_members_new_ride() IS
  'Après INSERT ride GROUP : notif in-app pour chaque membre (hors créateur), target_ride_id renseigné, user_id = users.id.';
