-- Justificatif d’immatriculation (KBIS / extrait Kbis) pour facturation — consultable dans l’app et côté admin.

ALTER TABLE public.vtc_profiles
  ADD COLUMN IF NOT EXISTS legal_kbis_url text;

COMMENT ON COLUMN public.vtc_profiles.legal_kbis_url IS
  'URL signée ou chemin storage : KBIS / extrait Kbis lié au SIRET (dépôt optionnel depuis Infos légales).';
