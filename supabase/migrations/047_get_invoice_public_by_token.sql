-- ============================================================================
-- Migration 047: RPC get_invoice_public_by_token – facture + chauffeur + adresses
-- ============================================================================
-- Résout le chauffeur comme la page devis (quotes.driver_id) :
-- 1) vtc_profile_id sur la facture
-- 2) source_type/source_id → ride/personal_ride → picker_id/creator_id/driver_id
-- 3) quote_id (facture ou course) → quotes.driver_id (même logique que devis)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_invoice_public_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv record;
  v_vpid text;
  v_driver_user_id text;
  v_ride record;
  v_pr record;
  v_profile record;
  v_user record;
  v_pickup text;
  v_dropoff text;
  v_quote_id text;
  v_quote_id_from_inv text;
  v_result jsonb;
  v_uid text;
  v_has_profile boolean := false;
  v_has_user boolean := false;
BEGIN
  -- 1) Facture par public_token ou token
  SELECT i.* INTO v_inv
  FROM public.invoices i
  WHERE i.public_token = p_token OR i.token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_vpid := v_inv.vtc_profile_id;
  v_driver_user_id := NULL;
  v_pickup := NULL;
  v_dropoff := NULL;
  v_quote_id := NULL;
  v_quote_id_from_inv := NULL;
  BEGIN
    v_quote_id_from_inv := v_inv.quote_id;
  EXCEPTION WHEN undefined_column OR others THEN
    NULL;
  END;

  -- 2) Si pas de vtc_profile_id, dériver le chauffeur depuis la course (source_type/source_id)
  IF v_vpid IS NULL AND v_inv.source_type IS NOT NULL AND v_inv.source_id IS NOT NULL THEN
    IF v_inv.source_type = 'RIDE' THEN
      SELECT pickup_address, dropoff_address, quote_id, picker_id, creator_id
        INTO v_ride
        FROM public.rides
        WHERE id = v_inv.source_id
        LIMIT 1;
      IF FOUND THEN
        v_driver_user_id := COALESCE(v_ride.picker_id, v_ride.creator_id);
        v_pickup := v_ride.pickup_address;
        v_dropoff := v_ride.dropoff_address;
        v_quote_id := v_ride.quote_id;
      END IF;
    ELSIF v_inv.source_type = 'PERSONAL' THEN
      SELECT pickup_address, dropoff_address, quote_id, driver_id
        INTO v_pr
        FROM public.personal_rides
        WHERE id = v_inv.source_id
        LIMIT 1;
      IF FOUND THEN
        v_driver_user_id := v_pr.driver_id;
        v_pickup := v_pr.pickup_address;
        v_dropoff := v_pr.dropoff_address;
        v_quote_id := v_pr.quote_id;
      END IF;
    END IF;
    -- Profil VTC du chauffeur (par user_id)
    IF v_driver_user_id IS NOT NULL THEN
      SELECT id, user_id, display_name, legal_business_name, legal_address_line1,
             legal_postal_code, legal_city, siret, vat_option, vat_number
        INTO v_profile
        FROM public.vtc_profiles
        WHERE user_id = v_driver_user_id
        LIMIT 1;
      IF FOUND THEN
        v_vpid := v_profile.id;
        v_has_profile := true;
      END IF;
    END IF;
  ELSIF v_vpid IS NOT NULL THEN
    -- Charger le profil pour avoir les infos + adresses depuis la course si dispo
    SELECT id, user_id, display_name, legal_business_name, legal_address_line1,
           legal_postal_code, legal_city, siret, vat_option, vat_number
      INTO v_profile
      FROM public.vtc_profiles
      WHERE id = v_vpid
      LIMIT 1;
    IF FOUND THEN
      v_has_profile := true;
    END IF;
    IF v_inv.source_type = 'RIDE' AND v_inv.source_id IS NOT NULL THEN
      SELECT pickup_address, dropoff_address, quote_id INTO v_ride
        FROM public.rides WHERE id = v_inv.source_id LIMIT 1;
      IF FOUND THEN
        v_pickup := v_ride.pickup_address;
        v_dropoff := v_ride.dropoff_address;
        v_quote_id := v_ride.quote_id;
      END IF;
    ELSIF v_inv.source_type = 'PERSONAL' AND v_inv.source_id IS NOT NULL THEN
      SELECT pickup_address, dropoff_address, quote_id INTO v_pr
        FROM public.personal_rides WHERE id = v_inv.source_id LIMIT 1;
      IF FOUND THEN
        v_pickup := v_pr.pickup_address;
        v_dropoff := v_pr.dropoff_address;
        v_quote_id := v_pr.quote_id;
      END IF;
    END IF;
  END IF;

  -- 2b) Fallback chauffeur via le devis (comme la page devis : driver_id sur quotes)
  IF v_driver_user_id IS NULL AND v_quote_id IS NOT NULL THEN
    SELECT driver_id INTO v_driver_user_id
      FROM public.quotes
      WHERE id = v_quote_id
      LIMIT 1;
  END IF;
  IF v_driver_user_id IS NULL AND v_quote_id_from_inv IS NOT NULL THEN
    SELECT driver_id INTO v_driver_user_id
      FROM public.quotes
      WHERE id = v_quote_id_from_inv
      LIMIT 1;
  END IF;
  IF v_driver_user_id IS NOT NULL AND NOT v_has_profile THEN
    SELECT id, user_id, display_name, legal_business_name, legal_address_line1,
           legal_postal_code, legal_city, siret, vat_option, vat_number
      INTO v_profile
      FROM public.vtc_profiles
      WHERE user_id = v_driver_user_id
      LIMIT 1;
    IF FOUND THEN
      v_has_profile := true;
    END IF;
  END IF;

  -- 3) Fallback profil par user_id si pas encore chargé
  IF NOT v_has_profile AND v_driver_user_id IS NOT NULL THEN
    SELECT id, user_id, display_name, legal_business_name, legal_address_line1,
           legal_postal_code, legal_city, siret, vat_option, vat_number
      INTO v_profile
      FROM public.vtc_profiles
      WHERE user_id = v_driver_user_id
      LIMIT 1;
    IF FOUND THEN
      v_has_profile := true;
    END IF;
  END IF;

  -- 4) User (tél, email) pour l’émetteur
  v_uid := NULL;
  IF v_has_profile AND v_profile.user_id IS NOT NULL THEN
    v_uid := v_profile.user_id;
  ELSIF v_driver_user_id IS NOT NULL THEN
    v_uid := v_driver_user_id;
  END IF;
  IF v_uid IS NOT NULL THEN
    SELECT full_name, email, phone INTO v_user
      FROM public.users
      WHERE id = v_uid
      LIMIT 1;
    IF FOUND THEN
      v_has_user := (v_user.full_name IS NOT NULL OR v_user.email IS NOT NULL OR v_user.phone IS NOT NULL);
    END IF;
  END IF;

  IF v_quote_id IS NULL AND v_quote_id_from_inv IS NOT NULL THEN
    v_quote_id := v_quote_id_from_inv;
  END IF;

  -- 5) Construire le JSON
  v_result := jsonb_build_object(
    'invoice', to_jsonb(v_inv),
    'pickup_address', v_pickup,
    'dropoff_address', v_dropoff,
    'quote_id', v_quote_id
  );
  IF v_has_profile THEN
    v_result := v_result || jsonb_build_object('vtc_profile', to_jsonb(v_profile));
  ELSE
    v_result := v_result || jsonb_build_object('vtc_profile', null);
  END IF;
  IF v_has_user THEN
    v_result := v_result || jsonb_build_object('driver_user', to_jsonb(v_user));
  ELSE
    v_result := v_result || jsonb_build_object('driver_user', null);
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_invoice_public_by_token(text) IS
  'Facture + chauffeur + adresses pour page/PDF. Chauffeur : vtc_profile_id, ou source_type/source_id, ou quote_id (quotes.driver_id comme le devis).';
