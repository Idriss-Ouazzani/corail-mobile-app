-- ============================================================================
-- Script SQL : Ajouter le statut EXPIRED et expirer les courses passées
-- ============================================================================
-- Databricks SQL - Unity Catalog
-- Schema: io_catalog.corail
-- 
-- Ce script :
-- 1. Met à jour les courses PUBLISHED dont scheduled_at est dans le passé → EXPIRED
-- 2. Vérifie le nombre de courses expirées
-- 
-- IMPORTANT : Le backend mettra automatiquement à jour les courses lors de chaque 
-- appel à GET /api/v1/rides, mais ce script permet une mise à jour manuelle initiale.
-- ============================================================================

-- 1. Mettre à jour les courses PUBLISHED dont la date est passée
UPDATE io_catalog.corail.rides
SET 
  status = 'EXPIRED',
  updated_at = CURRENT_TIMESTAMP()
WHERE status = 'PUBLISHED' 
  AND scheduled_at < CURRENT_TIMESTAMP();

-- 2. Vérifier le nombre de courses expirées
SELECT 
  COUNT(*) as expired_rides_count,
  'Courses expirées avec succès' as message
FROM io_catalog.corail.rides
WHERE status = 'EXPIRED';

-- 3. Afficher quelques exemples de courses expirées
SELECT 
  id,
  pickup_address,
  dropoff_address,
  scheduled_at,
  status,
  updated_at
FROM io_catalog.corail.rides
WHERE status = 'EXPIRED'
ORDER BY scheduled_at DESC
LIMIT 10;

-- 4. Statistiques par statut
SELECT 
  status,
  COUNT(*) as count,
  MIN(scheduled_at) as earliest_ride,
  MAX(scheduled_at) as latest_ride
FROM io_catalog.corail.rides
GROUP BY status
ORDER BY status;

