-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 074: 5 crédits onboarding après vérification chauffeur
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Chaque nouvel utilisateur reçoit 5 crédits une seule fois, après que son
-- profil chauffeur a été vérifié (driver_verification_status = 'approved').
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Ajouter le type de transaction pour le bonus post-vérification
ALTER TABLE public.credits_ledger
  DROP CONSTRAINT IF EXISTS credits_ledger_transaction_type_check;

ALTER TABLE public.credits_ledger
  ADD CONSTRAINT credits_ledger_transaction_type_check
  CHECK (transaction_type IN (
    'PUBLISH_RIDE',
    'CLAIM_RIDE',
    'COMPLETE_RIDE_BONUS',
    'RIDE_PICKED_BONUS',
    'ADMIN_ADJUSTMENT',
    'WELCOME_BONUS',
    'VERIFICATION_ONBOARDING_BONUS'
  ));

COMMENT ON CONSTRAINT credits_ledger_transaction_type_check ON public.credits_ledger IS
  'VERIFICATION_ONBOARDING_BONUS = 5 crédits une seule fois après vérification du profil chauffeur.';

-- 2. Étendre le trigger d'approbation : notification + 5 crédits une seule fois
CREATE OR REPLACE FUNCTION public.notify_user_driver_verification_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE'
      AND (OLD.driver_verification_status IS DISTINCT FROM 'approved')
      AND NEW.driver_verification_status = 'approved') THEN

    -- Notification in-app (existant)
    INSERT INTO public.in_app_notifications (user_id, type, title, body, target_screen)
    VALUES (
      NEW.user_id,
      'verification_approved',
      'Profil vérifié',
      'Votre profil professionnel a été vérifié. Vous avez accès au marketplace.',
      NULL
    );

    -- 5 crédits onboarding une seule fois après vérification
    IF NOT EXISTS (
      SELECT 1 FROM public.credits_ledger
      WHERE user_id = NEW.user_id AND transaction_type = 'VERIFICATION_ONBOARDING_BONUS'
    ) THEN
      INSERT INTO public.credits_ledger (user_id, amount, transaction_type, ride_id, description)
      VALUES (NEW.user_id, 5, 'VERIFICATION_ONBOARDING_BONUS', NULL, '5 crédits onboarding après vérification');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_user_driver_verification_approved() IS
  'À l''approbation du profil chauffeur : notification in-app + 5 crédits (une fois) pour l''onboarding.';
