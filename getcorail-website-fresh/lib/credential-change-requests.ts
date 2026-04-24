import { getSupabaseServer } from "./supabase-server";

export type CredentialRequestRow = {
  id: string;
  user_id: string;
  request_type: string;
  current_value: string | null;
  requested_value: string;
  document_path: string | null;
  document_path_verso?: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  user_email: string | null;
  user_full_name: string | null;
};

export async function listCredentialChangeRequests(options?: {
  status?: "pending" | "approved" | "rejected" | "all";
}): Promise<CredentialRequestRow[]> {
  const supabase = getSupabaseServer();
  let q = supabase
    .from("profile_credential_change_requests")
    .select("id, user_id, request_type, current_value, requested_value, document_path, document_path_verso, status, admin_note, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const st = options?.status ?? "pending";
  if (st !== "all") {
    q = q.eq("status", st);
  }

  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", userIds);
  const uMap = new Map((users || []).map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = uMap.get(r.user_id);
    return {
      ...r,
      user_email: u?.email ?? null,
      user_full_name: u?.full_name ?? null,
    } as CredentialRequestRow;
  });
}
