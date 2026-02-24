-- ============================================================================
-- Migration 068: RPC pour insérer une notification in-app (cloche) depuis l'app
-- ============================================================================
-- Permet d'ajouter dans la cloche les notifs actuellement uniquement locales :
-- course imminente, résumé quotidien (X courses aujourd'hui), rappel 1h avant, etc.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.insert_my_in_app_notification(
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_target_ride_id TEXT DEFAULT NULL,
  p_target_screen TEXT DEFAULT NULL,
  p_target_personal_ride_id TEXT DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_id uuid;
BEGIN
  v_user_id := (
    SELECT id FROM public.users
    WHERE supabase_auth_id = auth.uid() OR id = auth.uid()::text
    LIMIT 1
  );
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid()::text;
  END IF;

  INSERT INTO public.in_app_notifications (
    user_id, type, title, body, target_ride_id, target_screen, target_personal_ride_id
  )
  VALUES (
    v_user_id, p_type, p_title, p_body, p_target_ride_id, p_target_screen, p_target_personal_ride_id
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.insert_my_in_app_notification(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS
  'Insère une notification in-app pour l''utilisateur connecté (ex. course imminente, résumé quotidien).';
