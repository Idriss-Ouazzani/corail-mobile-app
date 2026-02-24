-- Notifications in-app : devis (accepté/refusé) + nouvelle course dans un groupe
-- - quote_accepted / quote_refused : notif au chauffeur, tap → page de la course (ride ou personal_ride)
-- - ride_in_group : notif aux membres du groupe (sauf créateur), tap → Annonces filtrées par Groupes

-- Colonne pour ouvrir une course personnelle depuis une notif (devis)
ALTER TABLE public.in_app_notifications
  ADD COLUMN IF NOT EXISTS target_personal_ride_id TEXT REFERENCES public.personal_rides(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.in_app_notifications.target_personal_ride_id IS 'Course personnelle à ouvrir au tap (ex. notif devis accepté/refusé).';

-- =============================================================================
-- 1) Devis accepté ou refusé : notifier le chauffeur (quotes.driver_id)
--    Au tap → ouvrir la course (rides ou personal_rides selon quote_id)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.notify_driver_quote_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
  v_ride_id TEXT;
  v_personal_ride_id TEXT;
BEGIN
  IF (OLD.status IS NOT DISTINCT FROM NEW.status) OR (NEW.status NOT IN ('ACCEPTED', 'REFUSED')) THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'ACCEPTED' THEN
    v_type := 'quote_accepted';
    v_title := 'Devis accepté';
    v_body := 'Votre devis a été accepté par le client.';
  ELSE
    v_type := 'quote_refused';
    v_title := 'Devis refusé';
    v_body := 'Le client a refusé votre devis.';
  END IF;

  SELECT id INTO v_ride_id FROM public.rides WHERE quote_id = NEW.id LIMIT 1;
  SELECT id INTO v_personal_ride_id FROM public.personal_rides WHERE quote_id = NEW.id LIMIT 1;

  INSERT INTO public.in_app_notifications (user_id, type, title, body, target_ride_id, target_personal_ride_id)
  VALUES (NEW.driver_id, v_type, v_title, v_body, v_ride_id, v_personal_ride_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotes_notify_driver_status ON public.quotes;
CREATE TRIGGER trg_quotes_notify_driver_status
  AFTER UPDATE OF status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_quote_status_changed();

-- =============================================================================
-- 2) Nouvelle course dans un groupe : notifier les membres (sauf le créateur)
--    Au tap → Annonces filtrées par Groupes (target_screen = marketplace_groups)
-- =============================================================================
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
BEGIN
  IF (TG_OP <> 'INSERT') OR (NEW.visibility <> 'GROUP') OR (NEW.group_id IS NULL OR NEW.group_id = '') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id LIMIT 1;
  v_group_name := COALESCE(v_group_name, 'le groupe');
  v_body := 'Une nouvelle course a été publiée dans « ' || v_group_name || ' ».';

  FOR v_member IN
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id
      AND gm.user_id IS NOT NULL
      AND gm.user_id <> ''
      AND gm.user_id <> NEW.creator_id
  LOOP
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (v_member.user_id, 'ride_in_group', 'Nouvelle course dans un groupe', v_body, 'marketplace_groups');
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rides_notify_group_members ON public.rides;
CREATE TRIGGER trg_rides_notify_group_members
  AFTER INSERT ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_members_new_ride();
