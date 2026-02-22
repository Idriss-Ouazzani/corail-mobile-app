-- ============================================================================
-- Migration 036: Synchroniser le statut du devis vers les courses
-- ============================================================================
-- Quand un devis est accepté ou refusé (table quotes), on met à jour
-- quote_status dans rides et personal_rides pour que le chauffeur voie
-- le bon statut dans le détail de la course et la liste des courses.
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_quote_status_to_rides()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ACCEPTED', 'REFUSED') AND (OLD.status IS NULL OR OLD.status NOT IN ('ACCEPTED', 'REFUSED')) THEN
    BEGIN
      UPDATE public.rides
      SET quote_status = NEW.status, updated_at = NOW()
      WHERE quote_id = NEW.id;
    EXCEPTION WHEN undefined_column OR others THEN
      NULL;
    END;
    BEGIN
      UPDATE public.personal_rides
      SET quote_status = NEW.status
      WHERE quote_id = NEW.id;
    EXCEPTION WHEN undefined_column OR others THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_quote_status_to_rides() IS 'Met à jour quote_status sur rides et personal_rides quand le devis (quotes) passe en ACCEPTED ou REFUSED';

DROP TRIGGER IF EXISTS on_quote_status_change ON public.quotes;
CREATE TRIGGER on_quote_status_change
  AFTER UPDATE OF status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_status_to_rides();

COMMENT ON TRIGGER on_quote_status_change ON public.quotes IS 'Synchronise le statut du devis vers les courses liées (rides, personal_rides)';
