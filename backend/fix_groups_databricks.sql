-- Script pour adapter les tables groups pour Databricks
-- Syntaxe compatible Databricks SQL
-- Exécute ce script dans le SQL Editor de Databricks

USE CATALOG io_catalog;
USE SCHEMA corail;

-- ============================================================================
-- Option 1 : Ajouter les colonnes manquantes (syntaxe Databricks)
-- ============================================================================

-- Vérifier la structure actuelle
DESCRIBE TABLE groups;

-- Ajouter les colonnes manquantes
-- Note: Databricks utilise ADD COLUMNS (pluriel) et ignore si elles existent déjà
ALTER TABLE groups ADD COLUMNS (
  icon STRING COMMENT 'Emoji/icône du groupe',
  updated_at TIMESTAMP COMMENT 'Date de dernière modification'
);

-- Mettre à jour les valeurs par défaut pour les anciennes lignes
UPDATE groups SET icon = '👥' WHERE icon IS NULL;
UPDATE groups SET updated_at = created_at WHERE updated_at IS NULL;

-- ============================================================================
-- Créer la table group_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id STRING NOT NULL COMMENT 'ID unique du membership',
  group_id STRING NOT NULL COMMENT 'FK vers groups.id',
  user_id STRING COMMENT 'Firebase UID du membre (null si invitation en attente)',
  email STRING COMMENT 'Email de la personne invitée',
  role STRING COMMENT 'ADMIN, MEMBER',
  status STRING COMMENT 'ACTIVE, PENDING, REJECTED, LEFT',
  invited_by STRING COMMENT 'Firebase UID de qui a invité',
  invited_at TIMESTAMP COMMENT 'Date d\'invitation',
  accepted_at TIMESTAMP COMMENT 'Quand l\'invitation a été acceptée',
  created_at TIMESTAMP COMMENT 'Date de création',
  updated_at TIMESTAMP COMMENT 'Date de modification'
) COMMENT 'Table des membres et invitations de groupes';

-- ============================================================================
-- Nettoyer les anciennes données de test
-- ============================================================================
DELETE FROM groups WHERE id IN ('group-toulouse-001', 'group-airport-001', 'group-premium-001');
DELETE FROM group_members WHERE group_id IN ('group-toulouse-001', 'group-airport-001', 'group-premium-001');

-- ============================================================================
-- Insérer des groupes de test
-- ============================================================================
INSERT INTO groups (id, name, description, owner_id, icon, created_at, updated_at) VALUES
('group-toulouse-001', 'VTC Toulouse Centre', 'Chauffeurs spécialisés dans le centre-ville de Toulouse', 'NgnzMvZvqkhTw636aYvcoD3EtSD2', '🚕', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('group-airport-001', 'Spécialistes Aéroport', 'Courses aéroport Toulouse-Blagnac', 'user-demo-001', '✈️', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('group-premium-001', 'VTC Premium Toulouse', 'Véhicules premium et luxe uniquement', 'user-demo-002', '⭐', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- ============================================================================
-- Insérer des membres dans les groupes
-- ============================================================================

-- Groupe 1 : VTC Toulouse Centre (ton groupe)
INSERT INTO group_members (id, group_id, user_id, email, role, status, invited_by, invited_at, created_at, updated_at) VALUES
('member-001', 'group-toulouse-001', 'NgnzMvZvqkhTw636aYvcoD3EtSD2', 'test@corail.com', 'ADMIN', 'ACTIVE', null, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('member-002', 'group-toulouse-001', 'user-demo-001', 'youssef.d@vtcpro.fr', 'MEMBER', 'ACTIVE', 'NgnzMvZvqkhTw636aYvcoD3EtSD2', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('member-003', 'group-toulouse-001', 'user-demo-002', 'hassan.almasri@vtcpro.fr', 'MEMBER', 'ACTIVE', 'NgnzMvZvqkhTw636aYvcoD3EtSD2', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Groupe 2 : Spécialistes Aéroport
INSERT INTO group_members (id, group_id, user_id, email, role, status, invited_by, invited_at, created_at, updated_at) VALUES
('member-004', 'group-airport-001', 'user-demo-001', 'youssef.d@vtcpro.fr', 'ADMIN', 'ACTIVE', null, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('member-005', 'group-airport-001', 'user-demo-003', 'marie.dubois@vtcpro.fr', 'MEMBER', 'ACTIVE', 'user-demo-001', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('member-006', 'group-airport-001', null, 'nouveau.chauffeur@example.com', 'MEMBER', 'PENDING', 'user-demo-001', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Groupe 3 : VTC Premium
INSERT INTO group_members (id, group_id, user_id, email, role, status, invited_by, invited_at, created_at, updated_at) VALUES
('member-007', 'group-premium-001', 'user-demo-002', 'hassan.almasri@vtcpro.fr', 'ADMIN', 'ACTIVE', null, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('member-008', 'group-premium-001', 'user-demo-004', 'jean.martin@vtcpro.fr', 'MEMBER', 'ACTIVE', 'user-demo-002', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Voir la structure finale
DESCRIBE TABLE groups;

-- Voir tous les groupes avec leur propriétaire
SELECT 
  g.id,
  g.name,
  g.description,
  g.icon,
  u.full_name as owner_name,
  g.created_at
FROM groups g
LEFT JOIN users u ON g.owner_id = u.id
WHERE g.id LIKE 'group-%'
ORDER BY g.created_at DESC;

-- Voir les membres de chaque groupe
SELECT 
  g.name as group_name,
  g.icon,
  gm.role,
  gm.status,
  COALESCE(u.full_name, gm.email) as member_name,
  gm.email
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN users u ON gm.user_id = u.id
WHERE g.id LIKE 'group-%'
ORDER BY g.name, gm.role DESC, gm.status;

-- Compter les membres par groupe
SELECT 
  g.name,
  g.icon,
  COUNT(CASE WHEN gm.status = 'ACTIVE' THEN 1 END) as active_members,
  COUNT(CASE WHEN gm.status = 'PENDING' THEN 1 END) as pending_invitations,
  COUNT(*) as total
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.id LIKE 'group-%'
GROUP BY g.name, g.icon
ORDER BY g.name;

-- Voir les invitations en attente
SELECT 
  g.name as group_name,
  g.icon,
  gm.email as invited_email,
  gm.invited_at,
  inviter.full_name as invited_by_name
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN users inviter ON gm.invited_by = inviter.id
WHERE gm.status = 'PENDING';

