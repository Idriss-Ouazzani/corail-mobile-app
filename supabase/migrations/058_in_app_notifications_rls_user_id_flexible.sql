-- Notifications in-app : RLS pour accepter user_id = auth.uid() OU user_id = users.id (legacy)
-- Certains users ont users.id = Firebase UID et supabase_auth_id = UUID ; les triggers
-- peuvent insérer users.id. On autorise la lecture si la ligne appartient à l'utilisateur connecté
-- (auth.uid() = supabase_auth_id OU auth.uid()::text = users.id).

DROP POLICY IF EXISTS in_app_notifications_select_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_select_own ON public.in_app_notifications
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
  );

DROP POLICY IF EXISTS in_app_notifications_update_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_update_own ON public.in_app_notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()::text
    OR user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
  );

-- RPC : liste des notifications de l'utilisateur connecté (user_id = auth OU users.id)
CREATE OR REPLACE FUNCTION public.list_my_in_app_notifications(lim integer DEFAULT 50)
RETURNS SETOF public.in_app_notifications
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT n.*
  FROM public.in_app_notifications n
  WHERE n.user_id = auth.uid()::text
     OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1)
  ORDER BY n.created_at DESC
  LIMIT COALESCE(NULLIF(lim, 0), 50);
$$;

COMMENT ON FUNCTION public.list_my_in_app_notifications(integer) IS 'Liste les notifications in-app de l''utilisateur connecté (cloche).';

-- RPC : nombre de notifications non lues
CREATE OR REPLACE FUNCTION public.get_my_unread_notifications_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.in_app_notifications n
  WHERE n.read_at IS NULL
    AND (n.user_id = auth.uid()::text
         OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1));
$$;

COMMENT ON FUNCTION public.get_my_unread_notifications_count() IS 'Nombre de notifications non lues pour l''utilisateur connecté.';

-- RPC : marquer toutes mes notifications comme lues
CREATE OR REPLACE FUNCTION public.mark_all_my_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.in_app_notifications n
  SET read_at = now()
  WHERE n.read_at IS NULL
    AND (n.user_id = auth.uid()::text
         OR n.user_id = (SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text LIMIT 1));
END;
$$;

COMMENT ON FUNCTION public.mark_all_my_notifications_read() IS 'Marque toutes les notifications in-app de l''utilisateur connecté comme lues.';
