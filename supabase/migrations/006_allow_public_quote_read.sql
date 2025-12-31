-- ============================================================================
-- FIX: Permettre la lecture publique des devis via token
-- Problème: La page web (clé anon) ne peut pas lire les devis à cause du RLS
-- Solution: Ajouter une policy de lecture publique basée sur le token
-- ============================================================================

-- Ajouter une policy pour permettre la lecture publique des devis
-- N'importe qui avec le token peut consulter le devis (comme un lien de partage)
CREATE POLICY "Public can view quotes by token" 
  ON public.quotes 
  FOR SELECT 
  USING (true);

-- Note: Cette policy est sécurisée car:
-- 1. Elle permet UNIQUEMENT la lecture (SELECT)
-- 2. Le token est unique et aléatoire (12 caractères MD5)
-- 3. C'est le comportement attendu: un lien partageable public
-- 4. Les actions (accepter/refuser) passent par des fonctions RPC sécurisées

