-- ============================================
-- CORAIL - SYSTÈME DE BADGES GAMIFICATION
-- ============================================

-- 1️⃣ Table des badges disponibles
CREATE TABLE IF NOT EXISTS io_catalog.vtcmarket.badges (
  id STRING NOT NULL,
  name STRING NOT NULL,
  description STRING,
  icon STRING NOT NULL,  -- Nom de l'icône Ionicons
  color STRING NOT NULL,  -- Couleur hexadécimale
  rarity STRING NOT NULL,  -- COMMON, RARE, EPIC, LEGENDARY
  category STRING NOT NULL,  -- ACTIVITY, ACHIEVEMENT, MILESTONE, SPECIAL
  requirement_description STRING,  -- Description du critère pour l'obtenir
  created_at TIMESTAMP,
  PRIMARY KEY (id)
) USING DELTA;

-- 2️⃣ Table des badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS io_catalog.vtcmarket.user_badges (
  id STRING NOT NULL,
  user_id STRING NOT NULL,
  badge_id STRING NOT NULL,
  earned_at TIMESTAMP NOT NULL,
  progress INT,  -- Pour les badges avec progression (optionnel)
  PRIMARY KEY (id)
) USING DELTA;

-- 3️⃣ Insertion des badges de lancement
INSERT INTO io_catalog.vtcmarket.badges (id, name, description, icon, color, rarity, category, requirement_description, created_at) VALUES
  -- 🌟 SPECIAL / LEGENDARY
  ('badge-early-adopter', 'Early Adopter', 'Parmi les premiers utilisateurs de Corail', 'rocket', '#fbbf24', 'LEGENDARY', 'SPECIAL', 'Inscrit avant le 31 janvier 2025', CURRENT_TIMESTAMP()),
  ('badge-founder', 'Founder', 'Membre fondateur de la communauté Corail', 'star', '#a855f7', 'LEGENDARY', 'SPECIAL', 'Inscrit durant la période de lancement', CURRENT_TIMESTAMP()),
  
  -- 🚗 ACTIVITY / COMMON → EPIC
  ('badge-first-ride', 'Première course', 'Publié votre première course', 'car-sport', '#0ea5e9', 'COMMON', 'ACTIVITY', 'Publier 1 course', CURRENT_TIMESTAMP()),
  ('badge-5-rides', '5 courses', 'Publié 5 courses', 'car-sport', '#0ea5e9', 'COMMON', 'ACTIVITY', 'Publier 5 courses', CURRENT_TIMESTAMP()),
  ('badge-serial-publisher', 'Serial Publisher', 'Publié plus de 25 courses', 'newspaper', '#10b981', 'RARE', 'ACTIVITY', 'Publier 25 courses', CURRENT_TIMESTAMP()),
  ('badge-100-rides', 'Centurion', 'Publié 100 courses', 'trophy', '#ff6b47', 'EPIC', 'ACTIVITY', 'Publier 100 courses', CURRENT_TIMESTAMP()),
  
  -- 🏆 ACHIEVEMENT / RARE → LEGENDARY
  ('badge-driver-month', 'Driver of the Month', 'Chauffeur du mois', 'medal', '#fbbf24', 'EPIC', 'ACHIEVEMENT', 'Performance exceptionnelle ce mois', CURRENT_TIMESTAMP()),
  ('badge-perfect-rating', 'Étoile Parfaite', 'Maintenu une note de 5.0/5', 'star', '#fbbf24', 'EPIC', 'ACHIEVEMENT', 'Note moyenne de 5.0 avec min 10 avis', CURRENT_TIMESTAMP()),
  ('badge-50-reviews', 'Populaire', 'Reçu 50 avis', 'heart', '#ec4899', 'RARE', 'ACHIEVEMENT', 'Recevoir 50 avis', CURRENT_TIMESTAMP()),
  
  -- 🎯 MILESTONE / RARE → EPIC
  ('badge-1000-credits', 'Millionaire', 'Accumulé 1000 crédits', 'diamond', '#a855f7', 'EPIC', 'MILESTONE', 'Gagner 1000 crédits au total', CURRENT_TIMESTAMP()),
  ('badge-100-completed', 'Professionnel', '100 courses terminées', 'checkmark-circle', '#10b981', 'RARE', 'MILESTONE', 'Terminer 100 courses', CURRENT_TIMESTAMP()),
  ('badge-quick-responder', 'Réactif', 'Répond en moins de 5 minutes', 'flash', '#0ea5e9', 'RARE', 'MILESTONE', 'Temps de réponse moyen < 5 min', CURRENT_TIMESTAMP()),
  
  -- 🌐 COMMUNITY / RARE
  ('badge-group-creator', 'Community Builder', 'Créé un groupe de plus de 10 membres', 'people', '#8b5cf6', 'RARE', 'SPECIAL', 'Créer un groupe avec 10+ membres', CURRENT_TIMESTAMP()),
  ('badge-helpful', 'Entraide', 'Partagé plus de 50 courses en groupe', 'gift', '#06b6d4', 'RARE', 'SPECIAL', 'Partager 50 courses en groupe', CURRENT_TIMESTAMP()),
  
  -- 🎖️ LOYALTY / EPIC → LEGENDARY
  ('badge-30-days', 'Fidèle', '30 jours consécutifs d\'activité', 'calendar', '#10b981', 'RARE', 'MILESTONE', 'Connecté 30 jours d\'affilée', CURRENT_TIMESTAMP()),
  ('badge-1-year', 'Vétéran', '1 an sur Corail', 'ribbon', '#a855f7', 'EPIC', 'MILESTONE', 'Membre depuis 1 an', CURRENT_TIMESTAMP()),
  ('badge-platinum', 'Platinum VIP', 'Membre Platinum actif', 'shield', '#e5e7eb', 'LEGENDARY', 'SPECIAL', 'Abonnement Platinum actif', CURRENT_TIMESTAMP());

-- 4️⃣ Attribuer des badges de test à des utilisateurs
-- Remplace les user_id par les vrais IDs de tes utilisateurs Firebase
INSERT INTO io_catalog.vtcmarket.user_badges (id, user_id, badge_id, earned_at, progress) VALUES
  ('ub-001', '501dd19d-af5f-4b00-870b-96dbcbe8671e', 'badge-early-adopter', CURRENT_TIMESTAMP(), NULL),
  ('ub-002', '501dd19d-af5f-4b00-870b-96dbcbe8671e', 'badge-first-ride', CURRENT_TIMESTAMP(), NULL),
  ('ub-003', '501dd19d-af5f-4b00-870b-96dbcbe8671e', 'badge-5-rides', CURRENT_TIMESTAMP(), NULL),
  ('ub-004', '501dd19d-af5f-4b00-870b-96dbcbe8671e', 'badge-serial-publisher', CURRENT_TIMESTAMP(), NULL),
  ('ub-005', 'ac853b0b-04c4-4ca3-8e99-973283804283', 'badge-early-adopter', CURRENT_TIMESTAMP(), NULL),
  ('ub-006', 'ac853b0b-04c4-4ca3-8e99-973283804283', 'badge-driver-month', CURRENT_TIMESTAMP(), NULL);

-- 5️⃣ Vue pour récupérer les badges d'un utilisateur avec détails
CREATE OR REPLACE VIEW io_catalog.vtcmarket.v_user_badges_with_details AS
SELECT 
  ub.id,
  ub.user_id,
  ub.badge_id,
  ub.earned_at,
  ub.progress,
  b.name AS badge_name,
  b.description AS badge_description,
  b.icon AS badge_icon,
  b.color AS badge_color,
  b.rarity AS badge_rarity,
  b.category AS badge_category,
  b.requirement_description
FROM io_catalog.vtcmarket.user_badges ub
LEFT JOIN io_catalog.vtcmarket.badges b ON ub.badge_id = b.id
ORDER BY ub.earned_at DESC;

-- ✅ TERMINÉ !
-- Pour voir les badges d'un utilisateur :
-- SELECT * FROM io_catalog.vtcmarket.v_user_badges_with_details WHERE user_id = 'ton-user-id';


