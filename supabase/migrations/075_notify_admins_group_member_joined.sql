-- =============================================================================
-- 075 : Notification in-app pour les admins quand un membre rejoint un groupe
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_admins_group_member_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_member_name TEXT;
  v_admin RECORD;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  SELECT g.name INTO v_group_name FROM public.groups g WHERE g.id = NEW.group_id;
  SELECT u.full_name INTO v_member_name FROM public.users u WHERE u.id = NEW.user_id;

  v_group_name := COALESCE(v_group_name, 'votre groupe');
  v_member_name := COALESCE(NULLIF(TRIM(v_member_name), ''), 'Un membre');

  FOR v_admin IN
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id
      AND gm.role = 'ADMIN'
      AND gm.user_id IS DISTINCT FROM NEW.user_id
  LOOP
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (
      v_admin.user_id,
      'group_member_joined',
      'Nouveau membre',
      v_member_name || ' a rejoint « ' || v_group_name || ' ».',
      'groups'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_members_notify_joined ON public.group_members;
CREATE TRIGGER trg_group_members_notify_joined
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_group_member_joined();

COMMENT ON FUNCTION public.notify_admins_group_member_joined() IS
  'Notifie les admins du groupe (sauf le nouveau membre) lorsqu''un membre est ajouté.';
