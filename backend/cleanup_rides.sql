-- Script pour nettoyer/gérer les courses dans Databricks
-- Exécute ce script dans le SQL Editor de Databricks

USE CATALOG io_catalog;
USE SCHEMA corail;

-- ============================================================================
-- OPTION 1 : Supprimer TOUTES les courses
-- ============================================================================
-- ⚠️ ATTENTION : Ceci supprime TOUTES les données !
-- DELETE FROM rides;

-- ============================================================================
-- OPTION 2 : Supprimer seulement les courses de démo (seed data)
-- ============================================================================
-- Supprime toutes les courses créées par le script seed_rides.sql
DELETE FROM rides WHERE id LIKE 'ride-tls-%' 
  OR id LIKE 'ride-ld-%' 
  OR id LIKE 'ride-lux-%' 
  OR id LIKE 'ride-eco-%' 
  OR id LIKE 'ride-van-%' 
  OR id LIKE 'ride-early-%' 
  OR id LIKE 'ride-night-%';

-- ============================================================================
-- OPTION 3 : Supprimer les courses d'un utilisateur spécifique
-- ============================================================================
-- Remplace 'USER_ID' par l'ID Firebase de l'utilisateur
-- DELETE FROM rides WHERE creator_id = 'NgnzMvZvqkhTw636aYvcoD3EtSD2';

-- ============================================================================
-- OPTION 4 : Supprimer les vieilles courses (passées)
-- ============================================================================
-- Supprime toutes les courses dont la date est dépassée
-- DELETE FROM rides WHERE scheduled_at < CURRENT_TIMESTAMP();

-- ============================================================================
-- OPTION 5 : Voir le nombre de courses par statut
-- ============================================================================
SELECT 
  status,
  COUNT(*) as count,
  MIN(scheduled_at) as earliest,
  MAX(scheduled_at) as latest
FROM rides
GROUP BY status
ORDER BY status;

-- ============================================================================
-- OPTION 6 : Voir toutes les courses d'un utilisateur
-- ============================================================================
-- SELECT * FROM rides 
-- WHERE creator_id = 'NgnzMvZvqkhTw636aYvcoD3EtSD2'
-- ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 7 : Compter le total de courses
-- ============================================================================
SELECT 
  COUNT(*) as total_rides,
  COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as published,
  COUNT(CASE WHEN status = 'CLAIMED' THEN 1 END) as claimed,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
FROM rides;


