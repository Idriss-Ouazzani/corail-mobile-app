-- Script SQL pour créer les tables Databricks pour Corail VTC
-- À exécuter dans le SQL Editor de Databricks

USE CATALOG io_catalog;
CREATE SCHEMA IF NOT EXISTS corail;
USE SCHEMA corail;

-- ============================================================================
-- Table des courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS rides (
    id STRING NOT NULL,
    creator_id STRING NOT NULL,
    picker_id STRING,
    pickup_address STRING NOT NULL,
    dropoff_address STRING NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    price_cents INT NOT NULL,
    status STRING NOT NULL,  -- PUBLISHED, CLAIMED, COMPLETED, CANCELLED
    visibility STRING NOT NULL,  -- PUBLIC, GROUP
    vehicle_type STRING,  -- STANDARD, PREMIUM, ELECTRIC, VAN, LUXURY
    distance_km FLOAT,
    duration_minutes INT,
    commission_enabled BOOLEAN DEFAULT true,
    group_id STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    completed_at TIMESTAMP,
    CONSTRAINT rides_pk PRIMARY KEY (id)
);

-- ============================================================================
-- Table des utilisateurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id STRING NOT NULL,  -- Firebase UID
    email STRING NOT NULL,
    full_name STRING,
    phone STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    is_subscribed BOOLEAN DEFAULT false,
    subscription_plan STRING DEFAULT 'FREE',  -- FREE, PREMIUM, PLATINUM
    rating INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    CONSTRAINT users_pk PRIMARY KEY (id)
);

-- ============================================================================
-- Table des groupes
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
    id STRING NOT NULL,
    name STRING NOT NULL,
    description STRING,
    owner_id STRING NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT groups_pk PRIMARY KEY (id)
);

-- ============================================================================
-- Table des membres de groupes
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
    group_id STRING NOT NULL,
    user_id STRING NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT group_members_pk PRIMARY KEY (group_id, user_id)
);

-- ============================================================================
-- Données de test (optionnel)
-- ============================================================================

-- Insérer quelques utilisateurs de test
INSERT INTO users (id, email, full_name, phone, subscription_plan, rating, total_reviews) VALUES
('user-test-001', 'youssef@corail.com', 'Youssef D.', '+33612345678', 'PREMIUM', 48, 15),
('user-test-002', 'hassan@corail.com', 'Hassan Al Masri', '+33612345679', 'PREMIUM', 48, 12),
('user-test-003', 'marie@corail.com', 'Marie Dubois', '+33612345680', 'PLATINUM', 50, 20);

-- Insérer quelques courses de test
INSERT INTO rides (
    id, creator_id, pickup_address, dropoff_address, 
    scheduled_at, price_cents, status, visibility,
    vehicle_type, distance_km, duration_minutes, commission_enabled
) VALUES
(
    'ride-001', 
    'user-test-001',
    'Aéroport Toulouse-Blagnac',
    'Place du Capitole, Toulouse',
    TIMESTAMP '2025-01-15 14:30:00',
    2800,
    'PUBLISHED',
    'PUBLIC',
    'STANDARD',
    8.0,
    15,
    true
),
(
    'ride-002',
    'user-test-002',
    'Gare Toulouse-Matabiau',
    'Ramonville Saint-Agne',
    TIMESTAMP '2025-01-16 09:00:00',
    1800,
    'PUBLISHED',
    'PUBLIC',
    'ELECTRIC',
    12.0,
    20,
    false
),
(
    'ride-003',
    'user-test-003',
    'CHU Purpan, Toulouse',
    'Labège Innopole',
    TIMESTAMP '2025-01-17 16:00:00',
    3200,
    'PUBLISHED',
    'PUBLIC',
    'PREMIUM',
    18.0,
    30,
    true
);

-- Vérifier les données
SELECT * FROM users LIMIT 10;
SELECT * FROM rides LIMIT 10;


