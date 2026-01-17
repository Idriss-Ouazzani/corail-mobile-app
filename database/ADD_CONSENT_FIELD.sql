-- Ajouter le champ has_accepted_terms à la table users
-- Ce champ indique si l'utilisateur a accepté les CGU et la politique de confidentialité

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT false;

-- Ajouter la date d'acceptation
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Mettre à jour les utilisateurs existants (les considérer comme ayant accepté)
UPDATE public.users
SET has_accepted_terms = true,
    terms_accepted_at = NOW()
WHERE has_accepted_terms IS NULL OR has_accepted_terms = false;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_has_accepted_terms ON public.users(has_accepted_terms);

-- Vérification
SELECT id, email, has_accepted_terms, terms_accepted_at 
FROM public.users 
LIMIT 10;



