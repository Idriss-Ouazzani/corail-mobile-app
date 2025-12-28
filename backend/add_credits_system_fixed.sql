-- Script pour ajouter le système de crédits Corail (CORRIGÉ pour Databricks)
-- Exécute ce script dans le SQL Editor de Databricks

USE CATALOG io_catalog;
USE SCHEMA corail;

-- ============================================================================
-- Ajouter la colonne credits à la table users
-- ============================================================================

-- Vérifier la structure actuelle
DESCRIBE TABLE users;

-- Ajouter la colonne credits (Databricks syntaxe)
ALTER TABLE users ADD COLUMNS (
  credits INT COMMENT 'Crédits Corail de l\'utilisateur'
);

-- Mettre à jour tous les utilisateurs existants avec 5 crédits de départ
UPDATE users SET credits = 5 WHERE credits IS NULL;

-- ============================================================================
-- Créer une table pour l'historique des crédits (optionnel mais recommandé)
-- Version SANS DEFAULT pour compatibilité Databricks
-- ============================================================================
CREATE TABLE IF NOT EXISTS credits_history (
  id STRING NOT NULL COMMENT 'ID unique de la transaction',
  user_id STRING NOT NULL COMMENT 'Firebase UID de l\'utilisateur',
  amount INT NOT NULL COMMENT 'Montant du crédit (+1, -1, +2, etc.)',
  reason STRING NOT NULL COMMENT 'Raison: RIDE_CREATED, RIDE_CLAIMED, RIDE_COMPLETED, etc.',
  ride_id STRING COMMENT 'ID de la course associée',
  balance_after INT NOT NULL COMMENT 'Solde après la transaction',
  created_at TIMESTAMP COMMENT 'Date de la transaction (sera rempli par le backend)'
) COMMENT 'Historique des transactions de crédits';

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Voir la nouvelle structure de users
DESCRIBE TABLE users;

-- Voir les crédits de tous les utilisateurs
SELECT 
  id,
  full_name,
  email,
  credits,
  subscription_tier
FROM users
ORDER BY credits DESC;

-- Statistiques des crédits
SELECT 
  MIN(credits) as min_credits,
  MAX(credits) as max_credits,
  AVG(credits) as avg_credits,
  COUNT(*) as total_users
FROM users;

