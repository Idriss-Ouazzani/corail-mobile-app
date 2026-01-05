-- ============================================================================
-- QUICK FIX : À exécuter MAINTENANT dans Supabase Dashboard
-- ============================================================================

-- 1. Ajouter colonnes color et icon à groups
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'people';

-- 2. Mettre à jour les groupes existants avec des couleurs
UPDATE public.groups 
SET color = '#0ea5e9', icon = 'people' 
WHERE color IS NULL;

-- 3. Vérification : Afficher vos groupes
SELECT id, name, color, icon, creator_id 
FROM public.groups 
WHERE creator_id = auth.uid()::text;

-- 4. Assigner des badges à votre utilisateur (remplacez YOUR_USER_ID)
-- D'abord, vérifiez votre user_id
SELECT id, email, full_name FROM public.users LIMIT 5;

-- Ensuite, assignez des badges (remplacez 'YOUR_USER_ID' par votre vrai ID)
-- Décommentez et remplacez YOUR_USER_ID :

/*
INSERT INTO public.user_badges (user_id, badge_id) VALUES
  ('YOUR_USER_ID', 'early-adopter'),
  ('YOUR_USER_ID', 'first-ride')
ON CONFLICT DO NOTHING;
*/

-- 5. Vérifier les badges assignés
SELECT ub.*, b.name, b.icon, b.color 
FROM public.user_badges ub
JOIN public.badges b ON b.id = ub.badge_id
WHERE ub.user_id = auth.uid()::text;

-- 6. Si vous n'avez pas de badges, en voici quelques-uns à assigner :
-- (Remplacez YOUR_USER_ID par votre ID)
/*
INSERT INTO public.user_badges (user_id, badge_id) 
SELECT 'YOUR_USER_ID', id 
FROM public.badges 
WHERE id IN ('early-adopter', 'first-ride', 'active-week')
ON CONFLICT DO NOTHING;
*/

