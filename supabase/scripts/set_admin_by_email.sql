-- ============================================================================
-- Donner les droits admin à un utilisateur (pour voir les Vérifications par documents)
-- ============================================================================
-- À exécuter dans Supabase : SQL Editor → New query → coller ce script.
-- Remplace 'ton@email.com' par l'email du compte admin.
-- ============================================================================

UPDATE public.users
SET is_admin = true
WHERE email = 'ton@email.com';

-- Vérifier que c'est bien pris en compte
SELECT id, email, full_name, is_admin
FROM public.users
WHERE email = 'ton@email.com';
