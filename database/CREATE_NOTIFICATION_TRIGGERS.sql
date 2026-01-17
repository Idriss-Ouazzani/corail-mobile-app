-- ============================================================================
-- TRIGGERS BACKEND POUR NOTIFICATIONS PUSH AUTOMATIQUES
-- ============================================================================
-- Ce fichier est OPTIONNEL. Il permet d'automatiser l'envoi de notifications
-- depuis Supabase via des triggers, mais nécessite d'implémenter une Edge Function
-- pour appeler l'API Expo Push.
--
-- Pour l'instant, les notifications sont gérées côté client (React Native).
-- Ce fichier sert de référence pour une future implémentation backend.
-- ============================================================================

-- ============================================================================
-- 1. FONCTION POUR ENVOYER UNE NOTIFICATION PUSH (PLACEHOLDER)
-- ============================================================================
-- Cette fonction devra appeler une Edge Function Supabase qui envoie
-- la notification via l'API Expo Push

CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tokens TEXT[];
BEGIN
  -- Récupérer tous les tokens actifs de l'utilisateur
  SELECT ARRAY_AGG(push_token)
  INTO v_tokens
  FROM public.push_tokens
  WHERE user_id = p_user_id
    AND is_active = true;

  -- Si pas de tokens, ne rien faire
  IF v_tokens IS NULL OR array_length(v_tokens, 1) = 0 THEN
    RAISE NOTICE 'Aucun token push actif pour user: %', p_user_id;
    RETURN;
  END IF;

  -- TODO: Appeler une Edge Function Supabase pour envoyer la notification
  -- Exemple : 
  -- PERFORM net.http_post(
  --   url := 'https://[PROJECT_ID].supabase.co/functions/v1/send-push',
  --   headers := '{"Authorization": "Bearer [ANON_KEY]"}'::jsonb,
  --   body := jsonb_build_object(
  --     'tokens', v_tokens,
  --     'title', p_title,
  --     'body', p_body,
  --     'data', p_data
  --   )
  -- );

  RAISE NOTICE 'Notification envoyée à % tokens: %', array_length(v_tokens, 1), p_title;
END;
$$;

-- ============================================================================
-- 2. TRIGGER: NOTIFICATION QUAND UNE COURSE EST PRISE
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_ride_claimed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id TEXT;
  v_picker_name TEXT;
  v_pickup_address TEXT;
BEGIN
  -- Vérifier que le statut a changé vers CLAIMED
  IF NEW.status = 'CLAIMED' AND OLD.status = 'PUBLISHED' THEN
    -- Récupérer les infos nécessaires
    SELECT creator_id, pickup_address INTO v_creator_id, v_pickup_address
    FROM public.rides
    WHERE id = NEW.id;

    -- Récupérer le nom du picker
    SELECT full_name INTO v_picker_name
    FROM public.users
    WHERE id = NEW.picker_id;

    -- Ne pas notifier si le créateur a pris sa propre course
    IF v_creator_id IS NOT NULL AND v_creator_id != NEW.picker_id THEN
      PERFORM send_push_notification(
        v_creator_id,
        '🎉 Course prise !',
        v_picker_name || ' a pris votre course (' || v_pickup_address || ')',
        jsonb_build_object('type', 'ride_claimed', 'ride_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger (commenté car nécessite l'implémentation de l'Edge Function)
-- DROP TRIGGER IF EXISTS trigger_notify_ride_claimed ON public.rides;
-- CREATE TRIGGER trigger_notify_ride_claimed
-- AFTER UPDATE ON public.rides
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_ride_claimed();

-- ============================================================================
-- 3. TRIGGER: NOTIFICATION QUAND UNE COURSE EST TERMINÉE
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_ride_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id TEXT;
  v_driver_name TEXT;
  v_pickup_address TEXT;
  v_dropoff_address TEXT;
BEGIN
  -- Vérifier que le statut a changé vers COMPLETED
  IF NEW.status = 'COMPLETED' AND OLD.status = 'CLAIMED' THEN
    -- Récupérer les infos
    SELECT creator_id, pickup_address, dropoff_address 
    INTO v_creator_id, v_pickup_address, v_dropoff_address
    FROM public.rides
    WHERE id = NEW.id;

    -- Récupérer le nom du chauffeur
    SELECT full_name INTO v_driver_name
    FROM public.users
    WHERE id = NEW.picker_id;

    -- Notifier le créateur (si différent du chauffeur)
    IF v_creator_id IS NOT NULL AND v_creator_id != NEW.picker_id THEN
      PERFORM send_push_notification(
        v_creator_id,
        '✅ Course terminée',
        v_driver_name || ' a terminé la course: ' || v_pickup_address || ' → ' || v_dropoff_address,
        jsonb_build_object('type', 'ride_completed', 'ride_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger (commenté)
-- DROP TRIGGER IF EXISTS trigger_notify_ride_completed ON public.rides;
-- CREATE TRIGGER trigger_notify_ride_completed
-- AFTER UPDATE ON public.rides
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_ride_completed();

-- ============================================================================
-- 4. TRIGGER: NOTIFICATION D'INVITATION À UN GROUPE
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_group_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_name TEXT;
  v_inviter_name TEXT;
BEGIN
  -- Vérifier que l'invité a un ID (est inscrit sur la plateforme)
  IF NEW.invitee_id IS NOT NULL THEN
    -- Récupérer le nom du groupe
    SELECT name INTO v_group_name
    FROM public.groups
    WHERE id = NEW.group_id;

    -- Récupérer le nom de l'inviteur
    SELECT full_name INTO v_inviter_name
    FROM public.users
    WHERE id = NEW.inviter_id;

    -- Envoyer la notification
    PERFORM send_push_notification(
      NEW.invitee_id,
      '👥 Invitation groupe',
      v_inviter_name || ' vous a invité à rejoindre "' || v_group_name || '"',
      jsonb_build_object('type', 'group_invitation', 'invitation_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger (commenté)
-- DROP TRIGGER IF EXISTS trigger_notify_group_invitation ON public.group_invitations;
-- CREATE TRIGGER trigger_notify_group_invitation
-- AFTER INSERT ON public.group_invitations
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_group_invitation();

-- ============================================================================
-- INSTRUCTIONS D'ACTIVATION
-- ============================================================================
-- 
-- Pour activer ces triggers, vous devez :
-- 
-- 1. Créer une Edge Function Supabase qui appelle l'API Expo Push
--    (voir https://docs.expo.dev/push-notifications/sending-notifications/)
-- 
-- 2. Décommenter les lignes CREATE TRIGGER ci-dessus
-- 
-- 3. Modifier la fonction send_push_notification pour appeler votre Edge Function
-- 
-- 4. Vérifier que l'extension pg_net est activée :
--    CREATE EXTENSION IF NOT EXISTS pg_net;
-- 
-- Exemple d'Edge Function à créer : /supabase/functions/send-push/index.ts
-- 
-- ============================================================================

COMMENT ON FUNCTION send_push_notification IS 'Fonction placeholder pour envoyer des notifications push via une Edge Function';
COMMENT ON FUNCTION notify_ride_claimed IS 'Notifie le créateur quand sa course est prise';
COMMENT ON FUNCTION notify_ride_completed IS 'Notifie le créateur quand une course est terminée';
COMMENT ON FUNCTION notify_group_invitation IS 'Notifie un utilisateur quand il est invité à un groupe';



