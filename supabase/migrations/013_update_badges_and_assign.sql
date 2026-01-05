-- ============================================================================
-- Mettre à jour les badges existants et en attribuer à l'utilisateur
-- ============================================================================

-- 1. Mettre à jour les unlock_conditions des badges existants
UPDATE badges SET unlock_condition = '1 course complétée' WHERE id = 'first-ride';
UPDATE badges SET unlock_condition = '10 courses complétées' WHERE id = 'ten-rides';
UPDATE badges SET unlock_condition = '5 étoiles sur 10 courses' WHERE id = 'five-star';
UPDATE badges SET unlock_condition = 'Membre fondateur - Rejoindre en 2025' WHERE id = 'early-adopter';
UPDATE badges SET unlock_condition = '20 courses de nuit' WHERE id = 'night-owl';
UPDATE badges SET unlock_condition = 'Course en moins de 5 minutes' WHERE id = 'speed-demon';
UPDATE badges SET unlock_condition = '20 courses consécutives' WHERE id = 'marathon';
UPDATE badges SET unlock_condition = '10+ membres dans un groupe' WHERE id = 'community-hero';
UPDATE badges SET unlock_condition = '7 jours d\'activité consécutifs' WHERE id = 'active-week';
UPDATE badges SET unlock_condition = '20 courses partagées' WHERE id = 'generous';

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

-- 3. Attribuer automatiquement quelques badges à TOUS les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    -- Badge "Pionnier" (early-adopter)
    INSERT INTO user_badges (user_id, badge_id, earned_at, progress)
    VALUES (user_record.id, 'early-adopter', NOW(), 100)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- Badge "Première course" (first-ride)
    INSERT INTO user_badges (user_id, badge_id, earned_at, progress)
    VALUES (user_record.id, 'first-ride', NOW(), 100)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- Badge "10 courses" (ten-rides)
    INSERT INTO user_badges (user_id, badge_id, earned_at, progress)
    VALUES (user_record.id, 'ten-rides', NOW(), 100)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
END $$;

-- 4. Vérifier les résultats
SELECT 'Badges mis à jour:' as message, COUNT(*) as count FROM badges WHERE unlock_condition IS NOT NULL;
SELECT 'User badges attribués:' as message, COUNT(*) as count FROM user_badges;

