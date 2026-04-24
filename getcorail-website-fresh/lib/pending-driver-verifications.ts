import { getSupabaseServer } from "./supabase-server";

export type PendingDriverVerificationRow = {
  id: string;
  user_id: string;
  driver_verification_submitted_at: string | null;
  verification_id_document_type: string;
  verification_vtc_card_status: string;
  verification_vtc_card_status_verso: string;
  verification_id_card_status: string;
  verification_id_card_status_verso: string;
  verification_insurance_status: string;
  verification_vtc_card_url: string | null;
  verification_vtc_card_url_verso: string | null;
  verification_id_card_url: string | null;
  verification_id_card_url_verso: string | null;
  verification_insurance_url: string | null;
  user_full_name: string | null;
  user_email: string | null;
};

export async function listPendingDriverVerificationsForAdmin(): Promise<PendingDriverVerificationRow[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("vtc_profiles")
    .select(
      `
        id,
        user_id,
        driver_verification_submitted_at,
        verification_id_document_type,
        verification_vtc_card_status,
        verification_vtc_card_status_verso,
        verification_id_card_status,
        verification_id_card_status_verso,
        verification_insurance_status,
        verification_vtc_card_url,
        verification_vtc_card_url_verso,
        verification_id_card_url,
        verification_id_card_url_verso,
        verification_insurance_url,
        user:users!vtc_profiles_user_id_fkey(id, full_name, email)
      `
    )
    .eq("driver_verification_status", "pending")
    .order("driver_verification_submitted_at", { ascending: true });
  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  return data.map((row: any) => {
    const u = row.user;
    return {
      id: row.id,
      user_id: row.user_id,
      driver_verification_submitted_at: row.driver_verification_submitted_at,
      verification_id_document_type: row.verification_id_document_type ?? "cni",
      verification_vtc_card_status: row.verification_vtc_card_status ?? "missing",
      verification_vtc_card_status_verso: row.verification_vtc_card_status_verso ?? "missing",
      verification_id_card_status: row.verification_id_card_status ?? "missing",
      verification_id_card_status_verso: row.verification_id_card_status_verso ?? "missing",
      verification_insurance_status: row.verification_insurance_status ?? "missing",
      verification_vtc_card_url: row.verification_vtc_card_url,
      verification_vtc_card_url_verso: row.verification_vtc_card_url_verso,
      verification_id_card_url: row.verification_id_card_url,
      verification_id_card_url_verso: row.verification_id_card_url_verso,
      verification_insurance_url: row.verification_insurance_url,
      user_full_name: u?.full_name ?? null,
      user_email: u?.email ?? null,
    };
  });
}
