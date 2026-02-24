-- Notification in-app quand un chauffeur reçoit une réservation directe depuis le site
-- (insertion dans driver_ride_requests). Au tap → écran Demandes (driver requests).

CREATE OR REPLACE FUNCTION public.notify_driver_ride_request_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.driver_id IS NOT NULL AND NEW.driver_id <> '') THEN
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (
      NEW.driver_id,
      'ride_from_site',
      'Réservation directe',
      'Un client vous a adressé une demande de course depuis le site.',
      'driver_requests'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_ride_requests_notify_driver ON public.driver_ride_requests;
CREATE TRIGGER trg_driver_ride_requests_notify_driver
  AFTER INSERT ON public.driver_ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_ride_request_received();

COMMENT ON FUNCTION public.notify_driver_ride_request_received() IS 'Notifie le chauffeur dans la cloche quand une réservation directe (site) est créée (driver_ride_requests).';
