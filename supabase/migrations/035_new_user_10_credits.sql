-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 035: 10 crédits de bienvenue pour tout nouvel utilisateur
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Permet d'explorer la plateforme (prendre des courses chauffeur = 1 crédit).
-- Les courses client (site web) restent à 0 crédit.
-- WELCOME_BONUS existe déjà dans credits_ledger (027).
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, verification_status, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'UNVERIFIED',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 10 crédits de bienvenue pour explorer la plateforme (une seule fois par user)
  IF NOT EXISTS (
    SELECT 1 FROM public.credits_ledger
    WHERE user_id = NEW.id::text AND transaction_type = 'WELCOME_BONUS'
  ) THEN
    INSERT INTO public.credits_ledger (user_id, amount, transaction_type, ride_id, description)
    VALUES (NEW.id::text, 10, 'WELCOME_BONUS', NULL, '10 crédits de bienvenue');
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Créé le profil user + 10 crédits WELCOME_BONUS à l''inscription.';
