-- ============================================
-- CORAIL - TABLE PERSONAL_RIDES
-- ============================================
-- Stocke toutes les courses d'un chauffeur VTC
-- (Uber, Bolt, Direct Client, Marketplace)

-- 1️⃣ Créer la table des courses personnelles
CREATE TABLE IF NOT EXISTS io_catalog.corail.personal_rides (
  id STRING NOT NULL COMMENT 'ID unique de la course',
  driver_id STRING NOT NULL COMMENT 'ID du chauffeur (Firebase UID)',
  source STRING NOT NULL COMMENT 'Source: UBER, BOLT, DIRECT_CLIENT, MARKETPLACE, OTHER',
  
  -- Détails de la course
  pickup_address STRING NOT NULL COMMENT 'Adresse de départ',
  dropoff_address STRING NOT NULL COMMENT 'Adresse d\'arrivée',
  scheduled_at TIMESTAMP COMMENT 'Date/heure prévue',
  started_at TIMESTAMP COMMENT 'Heure de début réelle',
  completed_at TIMESTAMP COMMENT 'Heure de fin réelle',
  
  -- Infos financières
  price_cents INT COMMENT 'Prix en centimes (ex: 2800 = 28€)',
  currency STRING DEFAULT 'EUR' COMMENT 'Devise',
  
  -- Infos trajet
  distance_km FLOAT COMMENT 'Distance en kilomètres',
  duration_minutes INT COMMENT 'Durée en minutes',
  
  -- Infos client (optionnel, pour courses directes)
  client_name STRING COMMENT 'Nom du client (courses directes)',
  client_phone STRING COMMENT 'Téléphone du client',
  
  -- Notes et détails
  notes STRING COMMENT 'Notes personnelles',
  
  -- Statut
  status STRING NOT NULL COMMENT 'SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED',
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL COMMENT 'Date de création',
  updated_at TIMESTAMP NOT NULL COMMENT 'Dernière mise à jour'
) USING DELTA
COMMENT 'Courses personnelles des chauffeurs VTC (toutes sources)';

-- 2️⃣ Index pour performance
CREATE INDEX IF NOT EXISTS idx_personal_rides_driver 
ON io_catalog.corail.personal_rides (driver_id);

CREATE INDEX IF NOT EXISTS idx_personal_rides_date 
ON io_catalog.corail.personal_rides (completed_at);

CREATE INDEX IF NOT EXISTS idx_personal_rides_source 
ON io_catalog.corail.personal_rides (source);

-- 3️⃣ Vue pour stats rapides par chauffeur
CREATE OR REPLACE VIEW io_catalog.corail.v_driver_stats AS
SELECT 
  driver_id,
  COUNT(*) as total_rides,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_rides,
  SUM(CASE WHEN status = 'COMPLETED' THEN price_cents ELSE 0 END) / 100.0 as total_revenue_eur,
  SUM(CASE WHEN status = 'COMPLETED' THEN distance_km ELSE 0 END) as total_distance_km,
  AVG(CASE WHEN status = 'COMPLETED' THEN price_cents ELSE NULL END) / 100.0 as avg_price_eur,
  AVG(CASE WHEN status = 'COMPLETED' THEN duration_minutes ELSE NULL END) as avg_duration_min,
  source,
  DATE(completed_at) as date
FROM io_catalog.corail.personal_rides
WHERE status = 'COMPLETED'
GROUP BY driver_id, source, DATE(completed_at);

-- 4️⃣ Données de test pour développement
INSERT INTO io_catalog.corail.personal_rides (
  id, driver_id, source, 
  pickup_address, dropoff_address, 
  scheduled_at, completed_at,
  price_cents, distance_km, duration_minutes,
  status, created_at, updated_at
) VALUES
  -- Courses Uber
  ('ride-test-001', 'demo-driver-001', 'UBER',
   'Gare Toulouse-Matabiau', 'Aéroport Toulouse-Blagnac',
   TIMESTAMP('2025-12-28 08:30:00'), TIMESTAMP('2025-12-28 08:55:00'),
   2800, 12.5, 25,
   'COMPLETED', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  
  ('ride-test-002', 'demo-driver-001', 'UBER',
   'Place du Capitole', 'CHU Purpan',
   TIMESTAMP('2025-12-28 10:15:00'), TIMESTAMP('2025-12-28 10:35:00'),
   1500, 6.2, 20,
   'COMPLETED', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  
  -- Courses Bolt
  ('ride-test-003', 'demo-driver-001', 'BOLT',
   'Airbus Toulouse', 'Centre-ville',
   TIMESTAMP('2025-12-28 14:00:00'), TIMESTAMP('2025-12-28 14:30:00'),
   2200, 10.8, 30,
   'COMPLETED', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  
  -- Course directe client
  ('ride-test-004', 'demo-driver-001', 'DIRECT_CLIENT',
   'Domicile client', 'Restaurant Toulouse',
   TIMESTAMP('2025-12-28 19:00:00'), TIMESTAMP('2025-12-28 19:25:00'),
   3500, 15.0, 25,
   'COMPLETED', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  
  -- Course planifiée (demain)
  ('ride-test-005', 'demo-driver-001', 'DIRECT_CLIENT',
   'Hôtel Toulouse', 'Aéroport',
   TIMESTAMP('2025-12-30 06:00:00'), NULL,
   4000, NULL, NULL,
   'SCHEDULED', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- 5️⃣ Vérifier la création
SELECT COUNT(*) as total_rides, source
FROM io_catalog.corail.personal_rides
GROUP BY source;

-- 6️⃣ Tester la vue stats
SELECT * FROM io_catalog.corail.v_driver_stats
WHERE driver_id = 'demo-driver-001'
LIMIT 10;

