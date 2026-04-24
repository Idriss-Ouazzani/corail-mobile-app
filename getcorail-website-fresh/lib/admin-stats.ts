import { getSupabaseServer } from "./supabase-server";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export interface AdminDashboardStats {
  chauffeursTotal: number;
  chauffeursVerifies: number;
  actifs7j: number;
  annoncesPubliees7j: number;
  annoncesPrises7j: number;
  demandesSite7j: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = getSupabaseServer();

  const [
    { count: chauffeursTotal },
    { count: chauffeursVerifies },
    { data: actifsData },
    { count: annoncesPubliees7j },
    { count: annoncesPrises7j },
    { count: demandesSite7j },
  ] = await Promise.all([
    supabase.from("vtc_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("vtc_profiles")
      .select("*", { count: "exact", head: true })
      .eq("driver_verification_status", "approved"),
    supabase
      .from("rides")
      .select("creator_id, picker_id")
      .or(`created_at.gte.${SEVEN_DAYS_AGO},updated_at.gte.${SEVEN_DAYS_AGO}`),
    supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .gte("created_at", SEVEN_DAYS_AGO),
    supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .not("picker_id", "is", null)
      .gte("updated_at", SEVEN_DAYS_AGO),
    supabase
      .from("driver_ride_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", SEVEN_DAYS_AGO),
  ]);

  const actifIds = new Set<string>();
  (actifsData || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifIds.add(r.creator_id);
    if (r.picker_id) actifIds.add(r.picker_id);
  });

  return {
    chauffeursTotal: chauffeursTotal ?? 0,
    chauffeursVerifies: chauffeursVerifies ?? 0,
    actifs7j: actifIds.size,
    annoncesPubliees7j: annoncesPubliees7j ?? 0,
    annoncesPrises7j: annoncesPrises7j ?? 0,
    demandesSite7j: demandesSite7j ?? 0,
  };
}
