-- Pagination : ajout du paramètre offset à list_my_in_app_notifications
CREATE OR REPLACE FUNCTION public.list_my_in_app_notifications(lim integer DEFAULT 50, off integer DEFAULT 0)
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
  LIMIT COALESCE(NULLIF(lim, 0), 50)
  OFFSET GREATEST(0, COALESCE(off, 0));
$$;

COMMENT ON FUNCTION public.list_my_in_app_notifications(integer, integer) IS 'Liste les notifications in-app (cloche) avec pagination limit/offset.';
