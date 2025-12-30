-- ============================================================================
-- CORAIL VTC - Supabase Initial Schema
-- Migration from Databricks to PostgreSQL
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE public.users (
  id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  siren TEXT,
  professional_card_number TEXT,
  verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
  verification_submitted_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_verification_status ON public.users(verification_status);

-- ============================================================================
-- 2. RIDES TABLE (Marketplace)
-- ============================================================================
CREATE TABLE public.rides (
  id TEXT PRIMARY KEY DEFAULT ('ride-' || substr(md5(random()::text), 1, 8)),
  creator_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  picker_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  price_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
  visibility TEXT DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'GROUP')),
  vehicle_type TEXT CHECK (vehicle_type IN ('STANDARD', 'ELECTRIC', 'PREMIUM', 'VAN', 'LUXURY')),
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  group_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_rides_creator_id ON public.rides(creator_id);
CREATE INDEX idx_rides_picker_id ON public.rides(picker_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_scheduled_at ON public.rides(scheduled_at);
CREATE INDEX idx_rides_visibility ON public.rides(visibility);

-- ============================================================================
-- 3. PERSONAL RIDES TABLE
-- ============================================================================
CREATE TABLE public.personal_rides (
  id TEXT PRIMARY KEY DEFAULT ('personal-' || substr(md5(random()::text), 1, 8)),
  driver_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('UBER', 'BOLT', 'DIRECT_CLIENT', 'MARKETPLACE', 'OTHER')),
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  price_cents INTEGER,
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  client_name TEXT,
  client_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personal_rides_driver_id ON public.personal_rides(driver_id);
CREATE INDEX idx_personal_rides_source ON public.personal_rides(source);
CREATE INDEX idx_personal_rides_status ON public.personal_rides(status);

-- ============================================================================
-- 4. CREDITS LEDGER
-- ============================================================================
CREATE TABLE public.credits_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PUBLISH_RIDE', 'CLAIM_RIDE', 'COMPLETE_RIDE_BONUS', 'ADMIN_ADJUSTMENT', 'WELCOME_BONUS')),
  ride_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_ledger_user_id ON public.credits_ledger(user_id);

CREATE OR REPLACE FUNCTION get_user_credits(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.credits_ledger
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 5. BADGES
-- ============================================================================
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  unlock_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- ============================================================================
-- 6. GROUPS
-- ============================================================================
CREATE TABLE public.groups (
  id TEXT PRIMARY KEY DEFAULT ('group-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- ============================================================================
-- 7. PLANNING EVENTS
-- ============================================================================
CREATE TABLE public.planning_events (
  id TEXT PRIMARY KEY DEFAULT ('event-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('RIDE', 'MEETING', 'MAINTENANCE', 'PERSONAL', 'OTHER')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  notes TEXT,
  ride_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planning_events_user_id ON public.planning_events(user_id);
CREATE INDEX idx_planning_events_start_time ON public.planning_events(start_time);

-- ============================================================================
-- 8. ACTIVITY LOG
-- ============================================================================
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'RIDE_PUBLISHED', 'RIDE_CLAIMED', 'RIDE_COMPLETED', 'RIDE_CANCELLED',
    'PERSONAL_RIDE_ADDED', 'CREDIT_EARNED', 'CREDIT_SPENT',
    'BADGE_EARNED', 'GROUP_JOINED', 'GROUP_CREATED'
  )),
  description TEXT NOT NULL,
  ride_id TEXT,
  badge_id TEXT,
  group_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_rides_updated_at BEFORE UPDATE ON public.personal_rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_events_updated_at BEFORE UPDATE ON public.planning_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Note: auth.uid() returns UUID, but our IDs are TEXT (Firebase UIDs), so we cast
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid()::text = id OR is_admin = TRUE);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Verified users can read public rides" ON public.rides FOR SELECT USING (visibility = 'PUBLIC' AND status IN ('PUBLISHED', 'CLAIMED', 'IN_PROGRESS'));
CREATE POLICY "Users can read their own rides" ON public.rides FOR SELECT USING (creator_id = auth.uid()::text OR picker_id = auth.uid()::text);
CREATE POLICY "Users can create rides" ON public.rides FOR INSERT WITH CHECK (creator_id = auth.uid()::text);
CREATE POLICY "Creators can update their rides" ON public.rides FOR UPDATE USING (creator_id = auth.uid()::text);
CREATE POLICY "Users can manage own personal rides" ON public.personal_rides FOR ALL USING (driver_id = auth.uid()::text) WITH CHECK (driver_id = auth.uid()::text);
CREATE POLICY "Users can read own credits" ON public.credits_ledger FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Anyone can read badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own planning events" ON public.planning_events FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can read own activity" ON public.activity_log FOR SELECT USING (user_id = auth.uid()::text);

-- ============================================================================
-- SEED DATA
-- ============================================================================
INSERT INTO public.badges (id, name, description, icon, color, rarity) VALUES
  ('early-adopter', 'Early Adopter', 'Parmi les premiers à rejoindre Corail', 'rocket', '#fbbf24', 'LEGENDARY'),
  ('first-ride', 'Première course', 'Publié votre première course', 'car-sport', '#10b981', 'COMMON'),
  ('ten-rides', '10 courses', 'Publié 10 courses sur la marketplace', 'trophy', '#3b82f6', 'RARE'),
  ('generous', 'Généreux', 'Partagé plus de 20 courses', 'heart', '#ef4444', 'EPIC'),
  ('active-week', 'Actif 7 jours', 'Actif pendant 7 jours consécutifs', 'flame', '#f97316', 'RARE'),
  ('five-star', '5 étoiles', 'Maintenu une note de 5.0', 'star', '#fbbf24', 'EPIC'),
  ('speed-demon', 'Rapide', 'Accepté une course en moins de 5 minutes', 'flash', '#8b5cf6', 'RARE'),
  ('night-owl', 'Oiseau de nuit', 'Complété 10 courses de nuit', 'moon', '#6366f1', 'RARE'),
  ('marathon', 'Marathon', 'Complété 5 courses en une journée', 'fitness', '#ec4899', 'EPIC'),
  ('community-hero', 'Héros communautaire', 'Créé un groupe avec 10+ membres', 'people', '#14b8a6', 'LEGENDARY');

-- ============================================================================
-- REALTIME
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- ============================================================================
-- HELPER FUNCTION: Claim Ride
-- ============================================================================
CREATE OR REPLACE FUNCTION claim_ride(p_ride_id TEXT, p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_credits INTEGER;
  v_ride RECORD;
BEGIN
  v_user_credits := get_user_credits(p_user_id);
  IF v_user_credits < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;
  
  IF v_ride.status != 'PUBLISHED' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not available');
  END IF;
  
  UPDATE public.rides SET picker_id = p_user_id, status = 'CLAIMED', updated_at = NOW() WHERE id = p_ride_id;
  INSERT INTO public.credits_ledger (user_id, amount, transaction_type, ride_id, description)
  VALUES (p_user_id, -1, 'CLAIM_RIDE', p_ride_id, 'Claimed ride');
  INSERT INTO public.activity_log (user_id, action_type, description, ride_id)
  VALUES (p_user_id, 'RIDE_CLAIMED', 'Claimed ride', p_ride_id);
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
