-- Annonces "Groupes" : ne montrer que les courses des groupes dont l'utilisateur est membre.
-- La policy "Anyone can read published rides" (030) autorisait toutes les courses PUBLISHED,
-- y compris visibility = 'GROUP'. On la restreint aux courses PUBLIC uniquement.
-- Les courses GROUP restent visibles uniquement via "Users can read group rides" (021),
-- qui filtre sur group_members (user_id = auth.uid()).

DROP POLICY IF EXISTS "Anyone can read published rides" ON public.rides;
CREATE POLICY "Authenticated can read public published rides"
ON public.rides FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND status IN ('PUBLISHED', 'CLAIMED', 'IN_PROGRESS')
  AND (visibility IS NULL OR visibility = 'PUBLIC')
);

COMMENT ON POLICY "Authenticated can read public published rides" ON public.rides IS
  'Courses publiques visibles par tout utilisateur connecté. Les courses groupe sont visibles uniquement via la policy "Users can read group rides" (group_members).';
