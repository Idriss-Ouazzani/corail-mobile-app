-- Centre de notifications in-app : table + RLS + trigger sur rides
-- Permet d'afficher une liste de notifications avec pastille "non lues" et navigation vers le détail (ex. course).

-- S'assurer que les colonnes de notation existent (au cas où 034 n'a pas été appliquée)
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rating_by_picker_stars SMALLINT CHECK (rating_by_picker_stars >= 1 AND rating_by_picker_stars <= 5),
  ADD COLUMN IF NOT EXISTS rating_by_picker_comment TEXT,
  ADD COLUMN IF NOT EXISTS rating_by_picker_at TIMESTAMPTZ;

-- Table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  target_ride_id TEXT REFERENCES public.rides(id) ON DELETE SET NULL,
  target_screen TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read_at ON public.in_app_notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON public.in_app_notifications(created_at DESC);

COMMENT ON TABLE public.in_app_notifications IS 'Notifications in-app (cloche + liste) : course réclamée, terminée, notation, etc.';

-- RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- L'utilisateur ne voit que ses propres notifications
DROP POLICY IF EXISTS in_app_notifications_select_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_select_own ON public.in_app_notifications
  FOR SELECT USING (user_id = auth.uid()::text);

-- Marquer comme lu (UPDATE uniquement sur ses lignes)
DROP POLICY IF EXISTS in_app_notifications_update_own ON public.in_app_notifications;
CREATE POLICY in_app_notifications_update_own ON public.in_app_notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

-- L'insertion pour un autre user se fait via la fonction SECURITY DEFINER (trigger)

-- Fonction appelée par le trigger pour insérer une notification (contourne RLS)
CREATE OR REPLACE FUNCTION public.insert_in_app_notification_for_ride_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id TEXT;
  v_ride_id TEXT;
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  v_ride_id := NEW.id;
  v_creator_id := NEW.creator_id;

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

-- Trigger sur rides
DROP TRIGGER IF EXISTS trg_rides_in_app_notification ON public.rides;
CREATE TRIGGER trg_rides_in_app_notification
  AFTER UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_in_app_notification_for_ride_event();
