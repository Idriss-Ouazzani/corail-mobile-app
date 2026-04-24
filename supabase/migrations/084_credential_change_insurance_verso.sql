-- Changements certifiés : assurance + second fichier (verso carte VTC) pour comparaison admin.

ALTER TABLE public.profile_credential_change_requests
  ADD COLUMN IF NOT EXISTS document_path_verso text;

ALTER TABLE public.profile_credential_change_requests
  DROP CONSTRAINT IF EXISTS profile_credential_change_requests_request_type_check;

ALTER TABLE public.profile_credential_change_requests
  ADD CONSTRAINT profile_credential_change_requests_request_type_check
  CHECK (request_type IN ('phone', 'vtc_number', 'siret', 'insurance'));

COMMENT ON COLUMN public.profile_credential_change_requests.document_path_verso IS
  'Justificatif verso (ex. carte VTC) — optionnel selon type ; obligatoire pour vtc_number.';
