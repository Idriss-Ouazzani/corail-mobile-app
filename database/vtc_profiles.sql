-- ============================================================================
-- VTC Public Profiles - Landing Pages Marketing
-- ============================================================================
-- Description: Permet aux VTC de créer leur page publique (carte de visite web)
-- Usage: corail.app/vtc/[slug] pour chaque VTC
-- 
-- IMPORTANT: Cette table est INDÉPENDANTE, ne modifie rien à l'existant
-- ============================================================================

-- Table des profils publics VTC
CREATE TABLE IF NOT EXISTS vtc_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identifiant unique pour l'URL (ex: jean-dupont)
  slug TEXT UNIQUE NOT NULL,
  
  -- Informations affichées
  display_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  
  -- Coordonnées de contact (affichées publiquement)
  phone TEXT,
  whatsapp TEXT,  -- Format: 33612345678 (sans +)
  email TEXT,
  
  -- Services proposés (JSON array)
  services JSONB DEFAULT '[]'::jsonb,
  -- Exemple: ["Aéroport", "Mariage", "VIP", "Longue distance"]
  
  -- Zone de couverture
  zone_city TEXT,  -- Ex: "Toulouse"
  zone_radius_km INTEGER DEFAULT 50,
  
  -- Visibilité
  is_public BOOLEAN DEFAULT false,
  
  -- Analytics (pour le VTC)
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_vtc_profiles_slug ON vtc_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_vtc_profiles_user_id ON vtc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vtc_profiles_public ON vtc_profiles(is_public) WHERE is_public = true;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_vtc_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vtc_profiles_updated_at
  BEFORE UPDATE ON vtc_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_vtc_profiles_updated_at();

-- Politique RLS (Row Level Security)
ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les profils actifs (pour le site web)
CREATE POLICY "Public profiles are viewable by everyone"
  ON vtc_profiles FOR SELECT
  USING (is_public = true);

-- Le propriétaire peut tout faire sur son profil
CREATE POLICY "Users can manage their own profile"
  ON vtc_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Contrainte: slug doit être en lowercase et sans espaces
ALTER TABLE vtc_profiles ADD CONSTRAINT slug_format 
  CHECK (slug ~ '^[a-z0-9-]+$');

-- Contrainte: phone doit être un numéro valide (si renseigné)
ALTER TABLE vtc_profiles ADD CONSTRAINT phone_format 
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');

-- Commentaires pour la documentation
COMMENT ON TABLE vtc_profiles IS 'Profils publics des VTC pour leur page marketing (corail.app/vtc/[slug])';
COMMENT ON COLUMN vtc_profiles.slug IS 'Identifiant unique pour l''URL (ex: jean-dupont)';
COMMENT ON COLUMN vtc_profiles.services IS 'Liste des services proposés (JSON array)';
COMMENT ON COLUMN vtc_profiles.view_count IS 'Nombre de vues du profil (analytics pour le VTC)';
COMMENT ON COLUMN vtc_profiles.is_public IS 'Si false, le profil n''est pas accessible publiquement';

-- ============================================================================
-- Fonction pour incrémenter le compteur de vues
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_profile_view(profile_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE vtc_profiles
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE slug = profile_slug AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONNÉES DE TEST (optionnel, à commenter si pas besoin)
-- ============================================================================
-- INSERT INTO vtc_profiles (
--   user_id,
--   slug,
--   display_name,
--   bio,
--   phone,
--   whatsapp,
--   email,
--   services,
--   zone_city,
--   is_public
-- ) VALUES (
--   (SELECT id FROM users LIMIT 1),  -- Remplacer par un vrai user_id
--   'jean-dupont',
--   'Jean Dupont',
--   'VTC professionnel à Toulouse depuis 10 ans. Service premium, ponctualité garantie.',
--   '+33612345678',
--   '33612345678',
--   'jean.dupont@vtc.com',
--   '["Aéroport", "Mariage", "VIP", "Longue distance"]'::jsonb,
--   'Toulouse',
--   true
-- );

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

