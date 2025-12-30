-- Créer la table activity_log pour tracker toutes les actions dans l'app
-- Script SQL pour Databricks

CREATE TABLE IF NOT EXISTS io_catalog.corail.activity_log (
  id STRING NOT NULL,
  user_id STRING NOT NULL COMMENT 'Utilisateur qui a effectué l\'action',
  action_type STRING NOT NULL COMMENT 'Type d\'action: RIDE_CREATED, RIDE_CLAIMED, RIDE_COMPLETED, RIDE_DELETED, RIDE_PUBLISHED_PUBLIC, RIDE_PUBLISHED_GROUP, RIDE_PUBLISHED_PERSONAL',
  entity_type STRING COMMENT 'Type d\'entité: RIDE, GROUP, USER, etc.',
  entity_id STRING COMMENT 'ID de l\'entité affectée',
  metadata STRING COMMENT 'JSON avec détails supplémentaires',
  created_at TIMESTAMP NOT NULL,
  
  CONSTRAINT activity_log_pk PRIMARY KEY (id)
) USING DELTA
COMMENT 'Historique de toutes les activités utilisateurs';

-- Index pour performances
-- Unity Catalog gère automatiquement les index

-- Créer une vue pour l'activité récente avec détails enrichis
CREATE OR REPLACE VIEW io_catalog.corail.v_recent_activity AS
SELECT 
  a.id,
  a.user_id,
  u.full_name as user_name,
  u.email as user_email,
  a.action_type,
  a.entity_type,
  a.entity_id,
  a.metadata,
  a.created_at,
  -- Détails de la course si applicable
  r.pickup_address,
  r.dropoff_address,
  r.price_cents,
  r.visibility as ride_visibility
FROM io_catalog.corail.activity_log a
LEFT JOIN io_catalog.corail.users u ON a.user_id = u.id
LEFT JOIN io_catalog.corail.rides r ON a.entity_id = r.id AND a.entity_type = 'RIDE'
ORDER BY a.created_at DESC;

-- Test: Insérer quelques activités de test (optionnel)
-- Utiliser un user_id réel de ta table users
/*
INSERT INTO io_catalog.corail.activity_log 
(id, user_id, action_type, entity_type, entity_id, metadata, created_at)
VALUES 
  (CONCAT('activity-', CAST(UNIX_TIMESTAMP() AS STRING), '-1'), 'YOUR_USER_ID', 'RIDE_PUBLISHED_PUBLIC', 'RIDE', 'ride-123', '{"price": 2500, "from": "Toulouse", "to": "Aéroport"}', CURRENT_TIMESTAMP()),
  (CONCAT('activity-', CAST(UNIX_TIMESTAMP() AS STRING), '-2'), 'YOUR_USER_ID', 'RIDE_CLAIMED', 'RIDE', 'ride-456', '{"price": 3000}', CURRENT_TIMESTAMP()),
  (CONCAT('activity-', CAST(UNIX_TIMESTAMP() AS STRING), '-3'), 'YOUR_USER_ID', 'RIDE_COMPLETED', 'RIDE', 'ride-456', '{"bonus_credit": true}', CURRENT_TIMESTAMP());
*/

-- Vérifier que tout fonctionne
SELECT * FROM io_catalog.corail.activity_log LIMIT 10;
SELECT * FROM io_catalog.corail.v_recent_activity LIMIT 10;

