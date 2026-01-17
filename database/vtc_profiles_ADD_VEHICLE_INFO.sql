-- ============================================================================
-- VTC Profiles - Ajout informations véhicule et expérience
-- ============================================================================
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Ajouter les nouvelles colonnes
ALTER TABLE vtc_profiles 
ADD COLUMN IF NOT EXISTS vehicle_brand TEXT,           -- Ex: "Mercedes", "BMW", "Tesla"
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,           -- Ex: "Classe E", "Série 5", "Model 3"
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,         -- Ex: 2022
ADD COLUMN IF NOT EXISTS experience_years INTEGER,     -- Ex: 10
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["Français"]'::jsonb,  -- Ex: ["Français", "Anglais", "Espagnol"]
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;            -- Ex: ["WiFi", "Eau", "Chargeurs", "Siège bébé"]

-- Commentaires
COMMENT ON COLUMN vtc_profiles.vehicle_brand IS 'Marque du véhicule (ex: Mercedes, BMW, Tesla)';
COMMENT ON COLUMN vtc_profiles.vehicle_model IS 'Modèle du véhicule (ex: Classe E, Série 5)';
COMMENT ON COLUMN vtc_profiles.vehicle_year IS 'Année du véhicule';
COMMENT ON COLUMN vtc_profiles.experience_years IS 'Nombre d''années d''expérience en tant que VTC';
COMMENT ON COLUMN vtc_profiles.languages IS 'Langues parlées (JSON array)';
COMMENT ON COLUMN vtc_profiles.amenities IS 'Équipements disponibles dans le véhicule (JSON array)';

-- ============================================================================
-- Exemple de mise à jour du profil test
-- ============================================================================
-- UPDATE vtc_profiles
-- SET 
--   vehicle_brand = 'Mercedes',
--   vehicle_model = 'Classe E',
--   vehicle_year = 2022,
--   experience_years = 10,
--   languages = '["Français", "Anglais", "Espagnol"]'::jsonb,
--   amenities = '["WiFi", "Eau", "Chargeurs", "Siège bébé"]'::jsonb
-- WHERE slug = 'test-vtc';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================



