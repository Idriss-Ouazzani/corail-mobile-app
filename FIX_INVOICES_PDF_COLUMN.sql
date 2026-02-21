-- ============================================
-- 🔧 FIX: Ajouter la colonne pdf_generated_at à invoices
-- ============================================

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Vérifier que la colonne existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'invoices'
AND column_name = 'pdf_generated_at';

