-- ==========================================
-- Planning System for VTC Drivers
-- Tables: planning_events, notification_preferences
-- ==========================================

-- Table: planning_events
-- Stocke tous les événements du planning (courses, pauses, maintenance, etc.)
CREATE TABLE IF NOT EXISTS io_catalog.corail.planning_events (
  id STRING NOT NULL,
  driver_id STRING NOT NULL,
  event_type STRING NOT NULL, -- 'RIDE', 'BREAK', 'MAINTENANCE', 'PERSONAL'
  
  -- Ride reference (si event_type = 'RIDE')
  ride_id STRING, -- Peut être personal_ride_id ou marketplace ride_id
  ride_source STRING, -- 'MARKETPLACE', 'UBER', 'BOLT', 'DIRECT_CLIENT', 'OTHER'
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  estimated_duration_minutes INT,
  
  -- Location
  start_address STRING,
  end_address STRING,
  start_lat DOUBLE,
  start_lng DOUBLE,
  end_lat DOUBLE,
  end_lng DOUBLE,
  
  -- Status
  status STRING, -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  
  -- Notifications
  notification_30min_sent BOOLEAN,
  notification_1h_sent BOOLEAN,
  notification_custom_sent BOOLEAN,
  
  -- Metadata
  notes STRING,
  color STRING, -- Pour affichage calendrier (ex: '#6366f1')
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Table: notification_preferences
-- Préférences de notification pour chaque chauffeur
CREATE TABLE IF NOT EXISTS io_catalog.corail.notification_preferences (
  id STRING NOT NULL,
  driver_id STRING NOT NULL,
  
  -- Timing preferences
  reminder_30min BOOLEAN,
  reminder_1h BOOLEAN,
  reminder_custom_minutes INT, -- Ex: 45, 15, etc.
  reminder_custom_enabled BOOLEAN,
  
  -- Notification types
  notify_ride_start BOOLEAN,
  notify_ride_completion BOOLEAN,
  notify_conflicts BOOLEAN,
  notify_marketplace_opportunities BOOLEAN,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start STRING, -- Format: 'HH:MM'
  quiet_hours_end STRING,   -- Format: 'HH:MM'
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Insérer des préférences par défaut pour les utilisateurs existants
INSERT INTO io_catalog.corail.notification_preferences (
  id, driver_id,
  reminder_30min, reminder_1h, 
  reminder_custom_minutes, reminder_custom_enabled,
  notify_ride_start, notify_ride_completion, 
  notify_conflicts, notify_marketplace_opportunities,
  quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
  created_at, updated_at
)
SELECT 
  CONCAT('np-', id) as id,
  id as driver_id,
  TRUE as reminder_30min,
  FALSE as reminder_1h,
  15 as reminder_custom_minutes,
  FALSE as reminder_custom_enabled,
  TRUE as notify_ride_start,
  TRUE as notify_ride_completion,
  TRUE as notify_conflicts,
  TRUE as notify_marketplace_opportunities,
  FALSE as quiet_hours_enabled,
  '22:00' as quiet_hours_start,
  '07:00' as quiet_hours_end,
  current_timestamp() as created_at,
  current_timestamp() as updated_at
FROM io_catalog.corail.users
WHERE NOT EXISTS (
  SELECT 1 
  FROM io_catalog.corail.notification_preferences np 
  WHERE np.driver_id = io_catalog.corail.users.id
);

-- Vue: upcoming_events
-- Événements à venir pour faciliter les requêtes
CREATE OR REPLACE VIEW io_catalog.corail.v_upcoming_events AS
SELECT 
  pe.*,
  u.full_name as driver_name,
  u.phone as driver_phone
FROM io_catalog.corail.planning_events pe
JOIN io_catalog.corail.users u ON pe.driver_id = u.id
WHERE pe.start_time >= current_timestamp()
  AND pe.status IN ('SCHEDULED', 'IN_PROGRESS')
ORDER BY pe.start_time ASC;

-- Vue: today_schedule
-- Planning du jour pour chaque chauffeur
CREATE OR REPLACE VIEW io_catalog.corail.v_today_schedule AS
SELECT 
  pe.*,
  u.full_name as driver_name
FROM io_catalog.corail.planning_events pe
JOIN io_catalog.corail.users u ON pe.driver_id = u.id
WHERE DATE(pe.start_time) = CURRENT_DATE
  AND pe.status != 'CANCELLED'
ORDER BY pe.start_time ASC;

