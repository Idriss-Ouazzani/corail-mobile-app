-- Script pour créer la table users dans Databricks
-- Exécute ce script dans le SQL Editor de Databricks

USE CATALOG io_catalog;
USE SCHEMA corail;

-- ============================================================================
-- Créer la table users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id STRING NOT NULL COMMENT 'Firebase UID',
  email STRING NOT NULL,
  full_name STRING COMMENT 'Nom complet de l\'utilisateur',
  phone STRING COMMENT 'Numéro de téléphone',
  siret STRING COMMENT 'Numéro SIRET pour les VTC professionnels',
  is_verified BOOLEAN DEFAULT FALSE COMMENT 'Compte vérifié',
  subscription_tier STRING DEFAULT 'FREE' COMMENT 'FREE, PREMIUM, PLATINUM',
  rating INT DEFAULT 0 COMMENT 'Note moyenne (0-50)',
  total_reviews INT DEFAULT 0 COMMENT 'Nombre total d\'avis',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
) COMMENT 'Table des utilisateurs Corail VTC';

-- Créer un index sur l'ID pour optimiser les jointures
-- (Databricks gère cela automatiquement avec Delta Lake)

-- ============================================================================
-- Insérer des utilisateurs de test
-- ============================================================================
-- Utilisateur test (ton compte)
INSERT INTO users (id, email, full_name, phone, siret, is_verified, subscription_tier, rating, total_reviews) VALUES
('NgnzMvZvqkhTw636aYvcoD3EtSD2', 'test@corail.com', 'Idriss Ouazzani', '+33612345678', '12345678900001', true, 'PREMIUM', 50, 25);

-- Autres utilisateurs de démo
INSERT INTO users (id, email, full_name, phone, siret, is_verified, subscription_tier, rating, total_reviews) VALUES
('user-demo-001', 'youssef.d@vtcpro.fr', 'Youssef Driss', '+33623456789', '98765432100001', true, 'PREMIUM', 48, 20),
('user-demo-002', 'hassan.almasri@vtcpro.fr', 'Hassan Al Masri', '+33634567890', '11223344550001', true, 'PLATINUM', 50, 30),
('user-demo-003', 'marie.dubois@vtcpro.fr', 'Marie Dubois', '+33645678901', '55443322110001', true, 'FREE', 45, 12),
('user-demo-004', 'jean.martin@vtcpro.fr', 'Jean Martin', '+33656789012', '99887766550001', true, 'PREMIUM', 47, 18),
('user-demo-005', 'sarah.cohen@vtcpro.fr', 'Sarah Cohen', '+33667890123', '22334455660001', true, 'PLATINUM', 49, 22);

-- ============================================================================
-- Vérifier l'insertion
-- ============================================================================
SELECT * FROM users;

-- ============================================================================
-- Requête de test avec jointure
-- ============================================================================
SELECT 
  r.id,
  r.pickup_address,
  r.dropoff_address,
  r.price_cents,
  r.status,
  u.full_name as creator_name,
  u.email as creator_email,
  u.rating as creator_rating
FROM rides r
LEFT JOIN users u ON r.creator_id = u.id
LIMIT 10;

