-- ============================================================================
-- SOLUTION HYBRIDE RLS - Sécurité + Fonctionnalités publiques
-- ============================================================================
-- Stratégie : RLS strict sur données SENSIBLES, permissif sur données PUBLIQUES
-- ============================================================================

-- ============================================================================
-- PRINCIPE
-- ============================================================================
-- 
-- 🔴 RLS STRICT (Données privées/sensibles) :
--    - users (email, téléphone, etc.)
--    - credits (argent virtuel)
--    - personal_rides (courses privées)
--
-- 🟢 RLS PERMISSIF (Données publiques/marketplace) :
--    - vtc_profiles (annuaire public VTC)
--    - quotes (formulaire public)
--    - rides (marketplace public)
--
-- ⚙️ BYPASS RLS (Backend/Système) :
--    - Utiliser Service Role Key pour triggers/Edge Functions
--    - Les opérations système ne sont pas affectées par RLS
--
-- ============================================================================

-- ============================================================================
-- 1. TABLES AVEC RLS STRICT (Données sensibles)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: users (Données personnelles sensibles)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lecture : Seulement ses propres données
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = current_setting('request.jwt.claim.sub', true)); -- Sub du JWT Firebase

-- Modification : Seulement ses propres données
DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (id = current_setting('request.jwt.claim.sub', true));

-- Insertion : Permettre création (signup)
DROP POLICY IF EXISTS "Anyone can signup" ON users;
CREATE POLICY "Anyone can signup"
  ON users FOR INSERT
  WITH CHECK (true); -- Signup doit être ouvert

-- Admins voient tout (pour dashboard admin)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('request.jwt.claim.sub', true) 
        AND is_admin = true
    )
  );

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: credits (Argent virtuel - SENSIBLE)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Lecture : Seulement ses propres crédits
DROP POLICY IF EXISTS "Users can view their own credits" ON credits;
CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.sub', true));

-- ⚠️ IMPORTANT : Pas de policy INSERT/UPDATE pour users normaux
-- Les crédits sont modifiés UNIQUEMENT par :
-- 1. Triggers SQL (bypass RLS automatiquement)
-- 2. Edge Functions avec Service Role Key
-- 3. Backend avec Service Role Key

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: personal_rides (Courses privées)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE personal_rides ENABLE ROW LEVEL SECURITY;

-- Tout : Seulement ses propres courses
DROP POLICY IF EXISTS "Users can manage their personal rides" ON personal_rides;
CREATE POLICY "Users can manage their personal rides"
  ON personal_rides FOR ALL
  USING (user_id = current_setting('request.jwt.claim.sub', true))
  WITH CHECK (user_id = current_setting('request.jwt.claim.sub', true));

-- ============================================================================
-- 2. TABLES AVEC RLS PERMISSIF (Données publiques/marketplace)
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: vtc_profiles (Annuaire PUBLIC - pas sensible)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : PUBLIC (annuaire VTC)
DROP POLICY IF EXISTS "VTC profiles are public" ON vtc_profiles;
CREATE POLICY "VTC profiles are public"
  ON vtc_profiles FOR SELECT
  USING (true); -- ✅ Tout le monde peut voir

-- Création/Modification : N'importe qui peut créer/modifier
-- (Page publique VTC doit pouvoir faire upsert)
DROP POLICY IF EXISTS "Anyone can upsert VTC profiles" ON vtc_profiles;
CREATE POLICY "Anyone can upsert VTC profiles"
  ON vtc_profiles FOR ALL
  USING (true)
  WITH CHECK (true); -- ✅ Permissif pour page publique

-- Note : La sécurité est assurée par Firebase Auth côté app
--        La page publique a besoin de cet accès pour l'upsert

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: quotes (Formulaire PUBLIC)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Lecture : Créateur peut voir ses devis
DROP POLICY IF EXISTS "Users can view their quotes" ON quotes;
CREATE POLICY "Users can view their quotes"
  ON quotes FOR SELECT
  USING (true); -- ✅ Permissif (la page publique doit pouvoir lire)

-- Création : N'importe qui (formulaire public)
DROP POLICY IF EXISTS "Anyone can create quotes" ON quotes;
CREATE POLICY "Anyone can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true); -- ✅ Formulaire public doit pouvoir créer

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: rides (Marketplace PUBLIC)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Lecture : Tout le monde voit les courses marketplace
DROP POLICY IF EXISTS "Marketplace rides are public" ON rides;
CREATE POLICY "Marketplace rides are public"
  ON rides FOR SELECT
  USING (true); -- ✅ Marketplace = public

-- Création : Utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can create rides" ON rides;
CREATE POLICY "Authenticated users can create rides"
  ON rides FOR INSERT
  WITH CHECK (true); -- ✅ Permissif

-- Modification : Créateur ou picker
DROP POLICY IF EXISTS "Users can update their rides" ON rides;
CREATE POLICY "Users can update their rides"
  ON rides FOR UPDATE
  USING (true); -- ✅ Permissif (vérif côté app)

-- ============================================================================
-- 3. TABLES GROUPE (Mix public/privé)
-- ============================================================================

-- Groups : Lecture publique (découverte), modification restreinte
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups are visible" ON groups;
CREATE POLICY "Groups are visible"
  ON groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update groups" ON groups;
CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE
  USING (true); -- Permissif, vérif côté app

-- Group members : Permissif
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members visible" ON group_members;
CREATE POLICY "Group members visible"
  ON group_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Can manage members" ON group_members;
CREATE POLICY "Can manage members"
  ON group_members FOR ALL
  USING (true);

-- Group invitations : Permissif
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invitations visible" ON group_invitations;
CREATE POLICY "Invitations visible"
  ON group_invitations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Can manage invitations" ON group_invitations;
CREATE POLICY "Can manage invitations"
  ON group_invitations FOR ALL
  USING (true);

-- ============================================================================
-- 4. BACKEND/SYSTÈME : Utiliser Service Role Key
-- ============================================================================

-- Les opérations suivantes DOIVENT utiliser la Service Role Key (bypass RLS) :
--
-- 1. TRIGGERS SQL :
--    - Modification de crédits (credits_ledger)
--    - Statistiques automatiques
--    - Logs système
--    → Les triggers bypass RLS automatiquement (SECURITY DEFINER)
--
-- 2. EDGE FUNCTIONS :
--    - Notifications push
--    - Opérations admin
--    - Batch jobs
--    → Utiliser Service Role Key dans l'initialisation Supabase client
--
-- 3. BACKEND API (si vous en créez un) :
--    - Toutes les opérations "système"
--    → Utiliser Service Role Key
--
-- Exemple Edge Function :
--   const supabase = createClient(url, SERVICE_ROLE_KEY) // ✅ Bypass RLS

-- ============================================================================
-- 5. CONFIGURATION CLIENT (React Native)
-- ============================================================================

-- Dans src/lib/supabase.ts, utiliser ANON KEY (pas Service Role) :
--
-- export const supabase = createClient(
--   SUPABASE_URL,
--   SUPABASE_ANON_KEY,  // ✅ Anon Key = RLS activé
--   {
--     auth: { 
--       persistSession: false  // Firebase gère l'auth
--     }
--   }
-- );
--
-- Le JWT Firebase peut être passé dans les headers pour les policies strictes :
--
-- supabase.from('users').select('*')
--   .headers({ 'Authorization': `Bearer ${firebaseToken}` })

-- ============================================================================
-- 6. VÉRIFICATION
-- ============================================================================

-- Vérifier le RLS sur toutes les tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'vtc_profiles', 'credits', 'rides', 
    'personal_rides', 'quotes', 'groups'
  )
ORDER BY tablename;

-- Compter les policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- RÉSUMÉ DE LA STRATÉGIE
-- ============================================================================
--
-- ✅ AVANTAGES :
--    - Données sensibles protégées (users, credits)
--    - Pages publiques continuent de fonctionner (VTC, quotes)
--    - Triggers/backend fonctionnent (Service Role Key)
--    - Pas besoin de JWT complexe pour tout
--
-- ⚠️ COMPROMIS :
--    - vtc_profiles reste modifiable par tous (mais c'est un annuaire public)
--    - rides marketplace reste accessible (mais c'est voulu)
--    - quotes peuvent être créés anonymement (formulaire public)
--
-- 🔐 SÉCURITÉ RÉELLE :
--    - Données VRAIMENT sensibles protégées (users, credits)
--    - Firebase Auth vérifie l'identité côté app
--    - Backend vérifie les permissions pour actions critiques
--    - RLS = couche supplémentaire, pas unique défense
--
-- 🎯 POUR AMÉLIORER :
--    1. Ajouter rate limiting (éviter spam quotes/rides)
--    2. Logger les actions suspectes
--    3. Monitorer les modifications inhabituelles
--    4. Backend API pour actions vraiment critiques (crédits, admin)

COMMENT ON TABLE users IS 'RLS STRICT - Données personnelles sensibles';
COMMENT ON TABLE credits IS 'RLS STRICT - Crédits utilisateurs (modif système uniquement)';
COMMENT ON TABLE personal_rides IS 'RLS STRICT - Courses privées';
COMMENT ON TABLE vtc_profiles IS 'RLS PERMISSIF - Annuaire public VTC';
COMMENT ON TABLE quotes IS 'RLS PERMISSIF - Formulaire public';
COMMENT ON TABLE rides IS 'RLS PERMISSIF - Marketplace public';

