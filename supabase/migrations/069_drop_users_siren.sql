-- Migration 069: Supprimer la colonne SIREN de public.users
-- On ne garde que le SIRET (sur vtc_profiles) pour l'affichage et la facturation.

ALTER TABLE public.users
  DROP COLUMN IF EXISTS siren;
