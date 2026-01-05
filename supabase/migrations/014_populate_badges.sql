-- ============================================================================
-- Peupler les badges avec des unlock_conditions et attribuer automatiquement
-- ============================================================================

-- 1. Mettre à jour les unlock_conditions des badges existants
UPDATE badges SET unlock_condition = '1 course publiée' WHERE id = 'first-ride';
UPDATE badges SET unlock_condition = '10 courses publiées' WHERE id = 'ten-rides';
UPDATE badges SET unlock_condition = '50 courses publiées' WHERE id = 'fifty-rides';
UPDATE badges SET unlock_condition = '100 courses publiées' WHERE id = 'hundred-rides';
UPDATE badges SET unlock_condition = 'Membre fondateur - Rejoindre avant janvier 2026' WHERE id = 'early-adopter';
UPDATE badges SET unlock_condition = 'Note moyenne de 5.0 étoiles (minimum 5 avis)' WHERE id = 'five-star-driver';
UPDATE badges SET unlock_condition = '20 courses de nuit (22h-6h)' WHERE id = 'night-owl';
UPDATE badges SET unlock_condition = '30 courses le week-end' WHERE id = 'weekend-warrior';
UPDATE badges SET unlock_condition = '5 courses partagées en groupe' WHERE id = 'sharing-is-caring';

-- 2. Attribuer automatiquement le badge "early-adopter" à tous les utilisateurs créés avant janvier 2026
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT 
  id AS user_id,
  'early-adopter' AS badge_id,
  NOW() AS earned_at
FROM users
WHERE created_at < '2026-01-01T00:00:00Z'
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 3. Attribuer automatiquement le badge "first-ride" aux utilisateurs avec au moins 1 course
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT DISTINCT
  creator_id AS user_id,
  'first-ride' AS badge_id,
  NOW() AS earned_at
FROM rides
WHERE creator_id IN (
  SELECT creator_id
  FROM rides
  GROUP BY creator_id
  HAVING COUNT(*) >= 1
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 4. Attribuer automatiquement le badge "ten-rides" aux utilisateurs avec au moins 10 courses
INSERT INTO user_badges (user_id, badge_id, earned_at)
SELECT DISTINCT
  creator_id AS user_id,
  'ten-rides' AS badge_id,
  NOW() AS earned_at
FROM rides
WHERE creator_id IN (
  SELECT creator_id
  FROM rides
  GROUP BY creator_id
  HAVING COUNT(*) >= 10
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. Afficher le résultat
SELECT 
  'Badges mis à jour' AS action,
  COUNT(*) AS count
FROM badges
WHERE unlock_condition IS NOT NULL AND unlock_condition != ''
UNION ALL
SELECT 
  'Badges attribués' AS action,
  COUNT(*) AS count
FROM user_badges;

