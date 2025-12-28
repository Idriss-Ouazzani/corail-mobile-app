-- Script pour ajouter des courses variées avec différents créateurs
-- ⚠️ IMPORTANT : Exécute d'abord create_users_table.sql avant ce script !
-- Exécute ce script dans le SQL Editor de Databricks

USE CATALOG io_catalog;
USE SCHEMA corail;

-- Supprimer les anciennes courses de test
DELETE FROM rides WHERE id LIKE 'ride-tls-%' 
  OR id LIKE 'ride-ld-%' 
  OR id LIKE 'ride-lux-%' 
  OR id LIKE 'ride-eco-%' 
  OR id LIKE 'ride-van-%' 
  OR id LIKE 'ride-early-%' 
  OR id LIKE 'ride-night-%';

-- Courses publiques - Toulouse et région (créées par différents utilisateurs)
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-tls-001', 'user-demo-001', 'Aéroport Toulouse-Blagnac', 'Place du Capitole, Toulouse', '2025-12-29 08:30:00', 2800, 'PUBLISHED', 'PUBLIC', 'STANDARD', 15.2, 25, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-002', 'user-demo-002', 'Gare Toulouse-Matabiau', 'Airbus Blagnac', '2025-12-29 14:00:00', 3200, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 18.5, 30, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-003', 'user-demo-003', 'CHU Purpan, Toulouse', 'Labège Innopole', '2025-12-29 18:30:00', 3500, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 22.3, 35, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-004', 'user-demo-004', 'Blagnac Centre', 'Ramonville Saint-Agne', '2025-12-30 09:00:00', 2200, 'PUBLISHED', 'PUBLIC', 'STANDARD', 14.8, 28, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-005', 'user-demo-005', 'Colomiers, Place Centrale', 'Université Paul Sabatier', '2025-12-30 13:30:00', 1900, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 12.1, 22, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-006', 'user-demo-001', 'Tournefeuille, Mairie', 'Toulouse Saint-Cyprien', '2025-12-30 16:45:00', 2400, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 16.7, 26, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-007', 'user-demo-002', 'Balma, Centre Commercial Gramont', 'Aéroport Toulouse-Blagnac', '2025-12-31 07:15:00', 3800, 'PUBLISHED', 'PUBLIC', 'VAN', 25.4, 38, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-008', 'user-demo-003', 'L''Union, Centre-Ville', 'Toulouse Esquirol', '2025-12-31 11:00:00', 2000, 'PUBLISHED', 'PUBLIC', 'STANDARD', 11.5, 20, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-009', 'user-demo-004', 'Cugnaux, Zone Commerciale', 'Toulouse Compans Caffarelli', '2025-12-31 15:20:00', 2600, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 17.2, 29, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-tls-010', 'user-demo-005', 'Saint-Orens-de-Gameville', 'Gare Toulouse-Matabiau', '2025-12-31 19:45:00', 2900, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 19.8, 32, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses longue distance depuis Toulouse
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-ld-001', 'user-demo-001', 'Toulouse Capitole', 'Carcassonne Centre-Ville', '2026-01-02 09:00:00', 8500, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 92.5, 90, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-ld-002', 'user-demo-002', 'Aéroport Toulouse-Blagnac', 'Albi Cathédrale', '2026-01-02 14:30:00', 7200, 'PUBLISHED', 'PUBLIC', 'LUXURY', 78.3, 75, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-ld-003', 'user-demo-003', 'Toulouse Matabiau', 'Montauban Gare', '2026-01-03 08:00:00', 5500, 'PUBLISHED', 'PUBLIC', 'STANDARD', 54.2, 55, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-ld-004', 'user-demo-004', 'Place du Capitole, Toulouse', 'Auch Centre', '2026-01-03 16:00:00', 6800, 'PUBLISHED', 'PUBLIC', 'VAN', 72.1, 70, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-ld-005', 'user-demo-005', 'Toulouse Compans', 'Castres Gare', '2026-01-04 10:30:00', 6200, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 68.7, 65, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses premium/luxe (Paris, Monaco)
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-lux-001', 'user-demo-001', 'Château de Versailles', 'Aéroport Charles de Gaulle, Paris', '2025-12-30 06:00:00', 15000, 'PUBLISHED', 'PUBLIC', 'LUXURY', 45.8, 55, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-lux-002', 'user-demo-002', 'Hôtel Plaza Athénée, Paris 8e', 'Gare du Nord, Paris', '2025-12-30 19:00:00', 8500, 'PUBLISHED', 'PUBLIC', 'LUXURY', 12.3, 25, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-lux-003', 'user-demo-005', 'Monaco Casino', 'Aéroport Nice Côte d''Azur', '2026-01-05 11:00:00', 12000, 'PUBLISHED', 'PUBLIC', 'LUXURY', 35.7, 40, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses électriques (écologiques)
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-eco-001', 'user-demo-003', 'Toulouse Jean Jaurès', 'Clinique des Minimes, Toulouse', '2025-12-29 10:00:00', 1800, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 8.5, 18, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-eco-002', 'user-demo-004', 'Blagnac Andromède', 'Toulouse Capitole', '2025-12-29 17:30:00', 2200, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 13.2, 24, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-eco-003', 'user-demo-005', 'Labège Village', 'Gare Toulouse-Matabiau', '2025-12-30 12:15:00', 2400, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 15.7, 27, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses VAN (groupes/bagages)
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-van-001', 'user-demo-001', 'Aéroport Toulouse-Blagnac Terminal B', 'Hôtel Crowne Plaza, Toulouse', '2025-12-29 22:00:00', 3500, 'PUBLISHED', 'PUBLIC', 'VAN', 16.8, 28, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-van-002', 'user-demo-002', 'Toulouse Saint-Michel', 'Station de ski Peyragudes', '2026-01-06 06:00:00', 18000, 'PUBLISHED', 'PUBLIC', 'VAN', 156.4, 150, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-van-003', 'user-demo-003', 'Gare Toulouse-Matabiau', 'Stade Ernest-Wallon, Toulouse', '2025-12-30 20:00:00', 1500, 'PUBLISHED', 'PUBLIC', 'VAN', 5.2, 12, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses matinales (early bird)
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-early-001', 'user-demo-004', 'Toulouse Minimes', 'Aéroport Toulouse-Blagnac', '2025-12-29 05:00:00', 3200, 'PUBLISHED', 'PUBLIC', 'STANDARD', 18.2, 30, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-early-002', 'user-demo-005', 'Ramonville-Saint-Agne', 'Gare Toulouse-Matabiau', '2025-12-30 05:30:00', 2200, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 14.5, 25, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-early-003', 'user-demo-001', 'Colomiers Centre', 'Clinique Pasteur, Toulouse', '2025-12-31 06:00:00', 2600, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 16.3, 28, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Courses soirée/nuit
INSERT INTO rides (id, creator_id, pickup_address, dropoff_address, scheduled_at, price_cents, status, visibility, vehicle_type, distance_km, duration_minutes, commission_enabled, created_at, updated_at) VALUES
('ride-night-001', 'user-demo-002', 'Toulouse Place du Capitole', 'Aéroport Toulouse-Blagnac', '2025-12-29 23:30:00', 3800, 'PUBLISHED', 'PUBLIC', 'PREMIUM', 17.5, 28, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-night-002', 'user-demo-003', 'Gare Toulouse-Matabiau', 'Labège Village', '2025-12-30 01:15:00', 2800, 'PUBLISHED', 'PUBLIC', 'STANDARD', 15.8, 22, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
('ride-night-003', 'user-demo-004', 'Toulouse Esquirol', 'Purpan, Toulouse', '2025-12-31 02:00:00', 2400, 'PUBLISHED', 'PUBLIC', 'ELECTRIC', 13.4, 20, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

-- Vérifier le résultat avec jointure
SELECT 
  r.id,
  r.pickup_address,
  r.dropoff_address,
  r.price_cents / 100.0 as price_euros,
  r.vehicle_type,
  u.full_name as creator_name,
  u.email as creator_email
FROM rides r
LEFT JOIN users u ON r.creator_id = u.id
WHERE r.id LIKE 'ride-%'
ORDER BY r.scheduled_at
LIMIT 20;

