-- Rating par le chauffeur (picker) à l'auteur (creator) quand la course est terminée
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rating_by_picker_stars SMALLINT CHECK (rating_by_picker_stars >= 1 AND rating_by_picker_stars <= 5),
  ADD COLUMN IF NOT EXISTS rating_by_picker_comment TEXT,
  ADD COLUMN IF NOT EXISTS rating_by_picker_at TIMESTAMPTZ;

COMMENT ON COLUMN public.rides.rating_by_picker_stars IS 'Note 1-5 étoiles laissée par le chauffeur (picker) à l''auteur de la publication';
COMMENT ON COLUMN public.rides.rating_by_picker_comment IS 'Commentaire optionnel du chauffeur pour l''auteur';
COMMENT ON COLUMN public.rides.rating_by_picker_at IS 'Date de la notation';
