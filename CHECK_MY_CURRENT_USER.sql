-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 Vérifier le statut du user qui ne peut pas prendre de course
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1️⃣ Vérifier avec l'ID exact des logs
SELECT 
  id,
  email,
  full_name,
  verification_status,
  is_admin,
  has_accepted_terms,
  credits,
  created_at
FROM public.users
WHERE id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd';

-- 2️⃣ Vérifier aussi avec l'email
SELECT 
  id,
  email,
  full_name,
  verification_status,
  is_admin,
  has_accepted_terms,
  credits,
  created_at
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📝 DIAGNOSTIC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Si les 2 requêtes retournent des users DIFFÉRENTS :
--   → Tu as 2 comptes ! Un ancien et un nouveau
--   → Il faut te connecter avec le bon email
--
-- Si verification_status n'est PAS 'VERIFIED' :
--   → Exécute la requête de correction ci-dessous
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔧 CORRECTION : Forcer le statut VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Décommente et exécute cette requête si verification_status n'est pas VERIFIED :
UPDATE public.users
SET 
  verification_status = 'VERIFIED',
  is_admin = true,
  has_accepted_terms = true
WHERE id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd';

-- Vérifier que ça a fonctionné :
SELECT 
  id,
  email,
  verification_status,
  is_admin
FROM public.users
WHERE id = 'db5f396a-4c75-4792-a6ab-7f071d394bfd';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ⚠️ IMPORTANT : Après avoir mis à jour la DB
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Déconnecte-toi de l'app (Profil → Se déconnecter)
-- 2. FERME complètement l'app (force quit Expo Go)
-- 3. Redémarre Metro : npx expo start --clear
-- 4. Ouvre l'app et reconnecte-toi
-- 5. Vérifie les logs pour voir : verificationStatus: VERIFIED
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

