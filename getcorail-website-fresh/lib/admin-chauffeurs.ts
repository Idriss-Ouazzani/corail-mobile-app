import { getSupabaseServer } from "./supabase-server";

export interface ChauffeurRow {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  slug: string;
  driver_verification_status: string;
  zone_city: string | null;
  created_at: string;
}

export async function getAdminChauffeurs(options?: {
  filterUserIds?: string[];
  filterVerificationStatus?: string;
}): Promise<ChauffeurRow[]> {
  const supabase = getSupabaseServer();
  let query = supabase
    .from("vtc_profiles")
    .select("id, user_id, slug, driver_verification_status, zone_city, created_at")
    .order("created_at", { ascending: false });

  if (options?.filterVerificationStatus) {
    query = query.eq("driver_verification_status", options.filterVerificationStatus);
  }

  const { data: profiles, error } = await query;

  if (error) throw new Error(error.message);
  if (!profiles?.length) return [];

  let list = profiles;
  if (options?.filterUserIds?.length) {
    const idSet = new Set(options.filterUserIds);
    list = list.filter((p) => idSet.has(p.user_id));
  }

  const userIds = [...new Set(list.map((p) => p.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return list.map((p) => {
    const u = userMap.get(p.user_id);
    return {
      id: p.id,
      user_id: p.user_id,
      email: u?.email ?? "",
      full_name: u?.full_name ?? "",
      slug: p.slug ?? "",
      driver_verification_status: p.driver_verification_status ?? "not_started",
      zone_city: p.zone_city ?? null,
      created_at: p.created_at ?? "",
    };
  });
}
