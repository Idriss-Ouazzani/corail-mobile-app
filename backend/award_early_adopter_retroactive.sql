-- ============================================
-- ATTRIBUER LE BADGE "EARLY ADOPTER" RÉTROACTIVEMENT
-- ============================================
-- Ce script donne le badge à tous les utilisateurs
-- inscrits avant le 31 janvier 2025

-- 📋 1️⃣ Vérifier combien d'utilisateurs sont éligibles
SELECT 
  COUNT(*) as eligible_users,
  'Inscrits avant le 31 janvier 2025' as description
FROM io_catalog.corail.users
WHERE created_at < '2025-01-31 23:59:59';

-- 🔍 2️⃣ Voir qui a déjà le badge
SELECT 
  u.email,
  u.full_name,
  u.created_at,
  ub.earned_at
FROM io_catalog.corail.users u
LEFT JOIN io_catalog.corail.user_badges ub ON u.id = ub.user_id AND ub.badge_id = 'badge-early-adopter'
WHERE u.created_at < '2025-01-31 23:59:59'
ORDER BY u.created_at DESC;

-- 🏆 3️⃣ Attribuer le badge à tous les utilisateurs éligibles qui ne l'ont pas encore
INSERT INTO io_catalog.corail.user_badges (user_id, badge_id, earned_at)
SELECT 
  u.id,
  'badge-early-adopter' as badge_id,
  u.created_at as earned_at
FROM io_catalog.corail.users u
WHERE u.created_at < '2025-01-31 23:59:59'
  AND NOT EXISTS (
    SELECT 1 
    FROM io_catalog.corail.user_badges ub 
    WHERE ub.user_id = u.id 
    AND ub.badge_id = 'badge-early-adopter'
  );

-- ✅ 4️⃣ Vérifier que tout le monde a son badge
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.created_at as inscription,
  ub.earned_at as badge_received
FROM io_catalog.corail.users u
INNER JOIN io_catalog.corail.user_badges ub ON u.id = ub.user_id AND ub.badge_id = 'badge-early-adopter'
WHERE u.created_at < '2025-01-31 23:59:59'
ORDER BY u.created_at DESC;

-- 📊 5️⃣ Résumé final
SELECT 
  COUNT(DISTINCT u.id) as total_early_adopters,
  MIN(u.created_at) as premier_inscrit,
  MAX(u.created_at) as dernier_inscrit
FROM io_catalog.corail.users u
INNER JOIN io_catalog.corail.user_badges ub ON u.id = ub.user_id AND ub.badge_id = 'badge-early-adopter'
WHERE u.created_at < '2025-01-31 23:59:59';

