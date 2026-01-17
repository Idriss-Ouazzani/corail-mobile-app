-- ============================================================================
-- Ajouter contrainte UNIQUE sur user_id pour permettre l'UPSERT
-- ============================================================================
-- Description: Assure qu'un utilisateur ne peut avoir qu'un seul profil VTC
-- Nécessaire pour le bon fonctionnement de l'upsert
-- ============================================================================

-- Ajouter la contrainte UNIQUE sur user_id
ALTER TABLE vtc_profiles 
ADD CONSTRAINT vtc_profiles_user_id_unique UNIQUE (user_id);

-- Vérification
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'vtc_profiles' 
AND constraint_name LIKE '%user_id%';



