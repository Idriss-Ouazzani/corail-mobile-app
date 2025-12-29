-- ============================================
-- CORAIL - CORRIGER MON UTILISATEUR
-- ============================================

-- 📋 1️⃣ D'ABORD : Vérifier mon utilisateur actuel
SELECT 
  id,
  email,
  full_name,
  is_admin,
  verification_status,
  created_at
FROM io_catalog.corail.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ✅ 2️⃣ CORRIGER : Mettre à jour mon utilisateur
-- (Si la colonne is_admin n'existe pas, exécute d'abord add_admin_role.sql)
UPDATE io_catalog.corail.users
SET 
  full_name = 'Idriss Ouazzani',
  is_admin = TRUE,
  verification_status = 'VERIFIED'
WHERE email = 'mydrissouazzani@gmail.com';

-- 🔍 3️⃣ VÉRIFIER : Confirmer que c'est bon
SELECT 
  id,
  email,
  full_name,
  is_admin,
  verification_status,
  credits,
  created_at
FROM io_catalog.corail.users
WHERE email = 'mydrissouazzani@gmail.com';

-- 📊 4️⃣ VOIR : Tous les utilisateurs
SELECT 
  email,
  full_name,
  is_admin,
  verification_status,
  credits,
  created_at
FROM io_catalog.corail.users
ORDER BY created_at DESC;

