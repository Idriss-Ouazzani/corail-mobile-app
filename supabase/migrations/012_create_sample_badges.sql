-- ============================================================================
-- Créer des badges de test pour le système VTC
-- ============================================================================

-- 1. Insérer des badges si la table est vide
INSERT INTO badges (id, name, description, icon, color, rarity, unlock_condition, created_at)
VALUES
  ('badge_first_ride', 'Premier Pas', 'Votre première course complétée', '🚗', '#10b981', 'COMMON', 'Complete 1 ride', NOW()),
  ('badge_10_rides', 'Étoile Montante', '10 courses complétées avec succès', '⭐', '#3b82f6', 'UNCOMMON', 'Complete 10 rides', NOW()),
  ('badge_50_rides', 'Expert VTC', '50 courses à votre actif', '🏆', '#8b5cf6', 'RARE', 'Complete 50 rides', NOW()),
  ('badge_100_rides', 'Légende', '100 courses complétées', '💎', '#fbbf24', 'EPIC', 'Complete 100 rides', NOW()),
  ('badge_share_10', 'Partage Pro', '10 courses partagées avec la communauté', '🤝', '#ec4899', 'UNCOMMON', 'Share 10 rides', NOW()),
  ('badge_early_adopter', 'Pionnier', 'Membre fondateur de Corail', '🌟', '#ff6b47', 'LEGENDARY', 'Join in 2025', NOW()),
  ('badge_perfect_rating', 'Satisfaction Client', 'Note parfaite sur 10 courses', '⭐⭐⭐⭐⭐', '#10b981', 'RARE', 'Perfect rating', NOW()),
  ('badge_night_owl', 'Noctambule', '20 courses de nuit complétées', '🌙', '#6366f1', 'UNCOMMON', '20 night rides', NOW()),
  ('badge_weekend_warrior', 'Champion du Week-end', '30 courses le week-end', '🎉', '#f59e0b', 'UNCOMMON', '30 weekend rides', NOW()),
  ('badge_community_helper', 'Entraide', 'A aidé 5 chauffeurs en difficulté', '❤️', '#ef4444', 'RARE', 'Help 5 drivers', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Créer la table user_badges si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY DEFAULT ('ubadge_' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- 3. Fonction pour attribuer automatiquement le badge "Pionnier" à tous les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    INSERT INTO user_badges (user_id, badge_id, earned_at, progress)
    VALUES (user_record.id, 'badge_early_adopter', NOW(), 100)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END $$;

-- 4. Vérifier les données
SELECT 'Badges créés:' as message, COUNT(*) as count FROM badges;
SELECT 'User badges attribués:' as message, COUNT(*) as count FROM user_badges;

