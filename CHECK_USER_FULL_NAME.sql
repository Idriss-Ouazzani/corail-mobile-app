-- Vérifier le full_name de l'utilisateur actuel
SELECT 
  id,
  email,
  full_name,
  phone,
  created_at
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

-- Si full_name est NULL ou vide, le mettre à jour
UPDATE public.users
SET full_name = 'Idriss Ouazzani'
WHERE email = 'mydrissouazzani@gmail.com'
  AND (full_name IS NULL OR full_name = '');

-- Vérifier le résultat
SELECT 
  id,
  email,
  full_name,
  phone
FROM public.users
WHERE email = 'mydrissouazzani@gmail.com';

