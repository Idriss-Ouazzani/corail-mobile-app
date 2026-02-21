-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 031: Origine de l'annonce (source) sur les rides
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Prépare l'arrivée d'annonces depuis site web, outil de résa,
-- hôtel/établissement ou client direct. Permet d'afficher un tag
-- à côté de Public/Groupe : Chauffeur, Hôtel, ou Client.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Ajouter la colonne source (défaut: chauffeur = annonce créée depuis l'app par un chauffeur)
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'chauffeur';

-- Contrainte optionnelle : valeurs autorisées (si pas d'ENUM utilisé, on peut faire un CHECK)
ALTER TABLE public.rides
DROP CONSTRAINT IF EXISTS rides_source_check;

ALTER TABLE public.rides
ADD CONSTRAINT rides_source_check
CHECK (source IS NULL OR source IN ('chauffeur', 'hotel', 'client'));

COMMENT ON COLUMN public.rides.source IS 
  'Origine de l''annonce: chauffeur (app), hotel (établissement), client (site web / outil de résa). Défaut: chauffeur.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 NOTES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- - Les annonces existantes ont source = 'chauffeur' (défaut)
-- - Quand vous brancherez le site web / outil résa / partenaires,
--   insérez avec source = 'client' ou 'hotel' selon le cas
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
