-- ============================================
-- CORAIL - AJOUTER RÔLE ADMIN
-- ============================================

-- 1️⃣ Ajouter la colonne is_admin
ALTER TABLE io_catalog.corail.users ADD COLUMNS (
  is_admin BOOLEAN
);

-- 2️⃣ Mettre tous les utilisateurs à non-admin par défaut
UPDATE io_catalog.corail.users
SET is_admin = FALSE
WHERE is_admin IS NULL;

-- 3️⃣ Faire de TOI un super admin
-- Remplace 'ton.email@example.com' par ton vrai email
UPDATE io_catalog.corail.users
SET is_admin = TRUE
WHERE email = 'ton.email@example.com';

-- ✅ Vérifier qui est admin
SELECT email, full_name, is_admin, verification_status
FROM io_catalog.corail.users
WHERE is_admin = TRUE;

-- 📋 Voir tous les utilisateurs avec leur rôle
SELECT 
  email,
  full_name,
  is_admin,
  verification_status,
  created_at
FROM io_catalog.corail.users
ORDER BY created_at DESC;


