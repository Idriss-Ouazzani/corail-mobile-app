-- ============================================
-- METTRE À JOUR LA DATE DU BADGE "EARLY ADOPTER"
-- ============================================
-- Changer la date de 31 janvier 2025 à 25 janvier 2026

-- 📝 Mettre à jour la description du badge
UPDATE io_catalog.corail.badges
SET requirement_description = 'Inscrit avant le 25 janvier 2026'
WHERE id = 'badge-early-adopter';

-- ✅ Vérifier la mise à jour
SELECT id, name, requirement_description
FROM io_catalog.corail.badges
WHERE id = 'badge-early-adopter';

