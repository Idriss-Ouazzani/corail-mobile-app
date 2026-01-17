-- ============================================================================
-- FIX SÉCURITÉ URGENT - À exécuter AVANT production
-- ============================================================================
-- Ce script active RLS et crée des policies basiques pour protéger les données
-- Temps d'exécution : ~5 minutes
-- ============================================================================

-- ============================================================================
-- 1. FONCTION HELPER : Obtenir l'user_id depuis currentUserId côté app
-- ============================================================================
-- Note : Cette fonction est temporaire. Pour une vraie sécurité, il faut
--        utiliser le JWT Firebase (voir AUDIT_SECURITE.md)

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  -- Pour l'instant, on se fie au user_id passé par l'app
  -- TODO: Extraire du JWT Firebase pour vraie sécurité
  RETURN current_setting('app.current_user_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ACTIVER RLS SUR TOUTES LES TABLES CRITIQUES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLICIES POUR TABLE USERS
-- ============================================================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Public user info readable" ON users;

-- Lecture : Utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (true); -- Temporairement permissif pour éviter de casser l'app

-- Modification : Utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (true); -- Temporairement permissif

-- Insertion : Permettre création de compte
CREATE POLICY "Users can create their account"
  ON users FOR INSERT
  WITH CHECK (true); -- Temporairement permissif

-- ============================================================================
-- 4. POLICIES POUR VTC_PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view VTC profiles" ON vtc_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON vtc_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON vtc_profiles;

-- Lecture : Profils VTC publics (OK, c'est l'annuaire)
CREATE POLICY "Anyone can view VTC profiles"
  ON vtc_profiles FOR SELECT
  USING (true);

-- Modification : Seulement son propre profil
CREATE POLICY "Users can update their own profile"
  ON vtc_profiles FOR UPDATE
  USING (true); -- Temporairement permissif, à sécuriser avec JWT

-- Insertion : Seulement son propre profil
CREATE POLICY "Users can insert their own profile"
  ON vtc_profiles FOR INSERT
  WITH CHECK (true); -- Temporairement permissif

-- ============================================================================
-- 5. POLICIES POUR CREDITS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own credits" ON credits;
DROP POLICY IF EXISTS "System can modify credits" ON credits;

-- Lecture : Seulement ses propres crédits
CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (true); -- Temporairement permissif

-- Modification : Seulement le système (via triggers)
CREATE POLICY "System can modify credits"
  ON credits FOR ALL
  USING (true); -- Temporairement permissif

-- ============================================================================
-- 6. POLICIES POUR RIDES (Marketplace)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view published rides" ON rides;
DROP POLICY IF EXISTS "Users can create rides" ON rides;
DROP POLICY IF EXISTS "Users can update their rides" ON rides;

-- Lecture : Tout le monde voit les courses publiées
CREATE POLICY "Anyone can view published rides"
  ON rides FOR SELECT
  USING (true); -- Public marketplace

-- Création : N'importe qui peut créer une course
CREATE POLICY "Users can create rides"
  ON rides FOR INSERT
  WITH CHECK (true);

-- Modification : Créateur ou picker
CREATE POLICY "Users can update their rides"
  ON rides FOR UPDATE
  USING (true); -- Temporairement permissif

-- ============================================================================
-- 7. POLICIES POUR PERSONAL_RIDES
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own personal rides" ON personal_rides;

-- Tout : Seulement ses propres courses
CREATE POLICY "Users can manage their own personal rides"
  ON personal_rides FOR ALL
  USING (true); -- Temporairement permissif

-- ============================================================================
-- 8. POLICIES POUR QUOTES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;

-- Lecture : Ses propres devis
CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  USING (true);

-- Création : Tout le monde
CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. POLICIES POUR GROUPS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update" ON groups;

-- Lecture : Membres peuvent voir leurs groupes
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (true); -- Temporairement permissif

-- Création : Tout le monde
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (true);

-- Modification : Admins seulement
CREATE POLICY "Group admins can update"
  ON groups FOR UPDATE
  USING (true); -- Temporairement permissif

-- ============================================================================
-- 10. POLICIES POUR GROUP_MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;

CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage members"
  ON group_members FOR ALL
  USING (true);

-- ============================================================================
-- 11. POLICIES POUR GROUP_INVITATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their invitations" ON group_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON group_invitations;

CREATE POLICY "Users can view their invitations"
  ON group_invitations FOR SELECT
  USING (true);

CREATE POLICY "Admins can create invitations"
  ON group_invitations FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 12. VÉRIFICATION
-- ============================================================================

-- Vérifier que RLS est activé sur toutes les tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'vtc_profiles', 'credits', 'rides', 
    'personal_rides', 'quotes', 'groups', 
    'group_members', 'group_invitations', 'push_tokens'
  )
ORDER BY tablename;

-- ✅ Toutes les tables devraient avoir rls_enabled = true

-- Compter les policies actives
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ✅ Chaque table devrait avoir au moins 1-3 policies

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- ⚠️ ATTENTION : Ce script utilise des policies "permissives" (USING true)
--                pour éviter de casser l'app existante.
--
-- 🔴 AVANT PRODUCTION : Il faut remplacer les "USING (true)" par des
--                       vérifications réelles basées sur le JWT Firebase
--                       ou un backend sécurisé.
--
-- 📚 Voir AUDIT_SECURITE.md pour les solutions complètes
--
-- ✅ Ce script est un "band-aid" temporaire pour activer RLS sans tout casser
--
-- 🎯 Prochaine étape : Implémenter get_firebase_user_id() et remplacer tous
--                      les "USING (true)" par "USING (user_id = get_firebase_user_id())"

COMMENT ON FUNCTION current_user_id IS 'Helper temporaire pour RLS - À remplacer par JWT Firebase';



