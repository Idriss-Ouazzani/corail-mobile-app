import { getSupabaseServer } from "./supabase-server";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const SIXTY_DAYS_AGO = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

export type DashboardPeriod = 7 | 30 | 90;

export function getSince(period: DashboardPeriod): string {
  const days = period === 7 ? 7 : period === 30 ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
const ANNOUNCE_NO_ANSWER_HOURS = 48;
/** Plafond pour le temps de prise (updated_at peut être la complétion, pas la prise). Au-delà = outlier. */
const MAX_HEURES_PRISE_POUR_MOYENNE = 48;

export interface AdminDashboardStats {
  chauffeursTotal: number;
  chauffeursVerifies: number;
  actifs7j: number;
  annoncesPubliees7j: number;
  annoncesPrises7j: number;
  demandesSite7j: number;
  demandesSiteTotal: number;
  kmMoyen: number;
  nombreGroupes: number;
  moyenneChauffeursParGroupe: number;
  coursesPerso: number;
  coursesPublic: number;
}

export interface VilleCount {
  ville: string;
  count: number;
}

export interface TopChauffeur {
  user_id: string;
  email: string;
  full_name: string;
  count: number;
}

export interface DernierUtilisateur {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface ActiviteItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  action_type: string;
  action_label: string;
  description: string;
  created_at: string;
}

/** Bloc "À traiter" : nécessite une décision */
export interface AlertesATraiter {
  chauffeursEnAttenteValidation: number;
  documentsExpires: number;
  comptesInactifs30j: number;
  annoncesSansReponse: number; // 48h+ (legacy)
  annoncesSansReponse24h: number;
  annoncesSansReponse12h: number;
  annoncesSansReponse6h: number;
  chauffeursActifsM1InactifsM: number; // actifs le mois dernier, inactifs ce mois-ci
  coursesAnnulees7j: number;
}

/** Santé réseau : indicateurs de pilotage */
export interface SanteReseau {
  chauffeursActifsPct: number;
  tauxConversionAnnoncesCourses: number;
  tauxUtilisationReseauPublic: number;
  nouveauxInscrits7j: number;
  /** Nouveaux inscrits 30j ayant publié au moins 1 annonce / total nouveaux 30j. Si < 40% = problème onboarding */
  tauxActivationNouveauxInscrits30j: number;
}

/** GMV et métriques économiques */
export interface GMVMetrics {
  gmvTotalCents: number;
  /** GMV sur la période sélectionnée (7j, 30j ou 90j) */
  gmvPeriodCents: number;
  gmv7jCents: number;
  gmv30jCents: number;
  gmv30jPrecedentCents: number; // 30-60j pour évolution vs mois précédent
  gmvMoyenneParCourseCents: number;
  evolution7jVs30jPct: number;
  /** Évolution GMV 30j vs mois précédent (30-60j). Si ne monte pas = pas de traction. */
  evolutionVsMoisPrecedentPct: number;
  /** Revenu moyen par chauffeur actif 30j = GMV 30j / actifs 30j. Objectif: faire monter chaque mois. */
  revenuMoyenParChauffeurActif30jCents: number;
  actifs30j: number;
}

/** Un point par jour pour le graph évolution */
export interface ActiviteJour {
  date: string; // YYYY-MM-DD
  label: string; // ex "12 fév."
  annonces: number;
  coursesCompletees: number;
  nouveauxInscrits: number;
}

export interface ChauffeurInactif {
  user_id: string;
  email: string;
  full_name: string | null;
  last_activity: string | null;
}

/** Chauffeurs à risque : actifs M-1, inactifs M, ou baisse activité > 50%. Action: les contacter. */
export interface ChauffeurRisque {
  user_id: string;
  email: string;
  full_name: string | null;
  raison: "actif_m1_inactif_m" | "baisse_50";
  activite_m1?: number;
  activite_m?: number;
}

/** Densité par ville : identifier une ville forte à densifier */
export interface DensiteVille {
  ville: string;
  chauffeursActifs: number;
  annonces7j: number;
  tauxConversion: number;
  tempsMoyenPriseHeures: number;
}

/** Temps moyen de prise d'annonce 7j (date prise - date publication). Objectif < 4h, > 12h = danger. */
export interface TempsMoyenPrise {
  heures: number;
  objectif4h: boolean;
  danger12h: boolean;
}

export async function getAlertesATraiter(period: DashboardPeriod = 7): Promise<AlertesATraiter> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const limit24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const limit12h = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const limit6h = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const limit48h = new Date(Date.now() - ANNOUNCE_NO_ANSWER_HOURS * 60 * 60 * 1000).toISOString();

  const [
    { count: chauffeursPending },
    { data: allVtcUserIds },
    { count: annoncesSansReponse },
    { count: annonces24h },
    { count: annonces12h },
    { count: annonces6h },
    { count: coursesAnnulees7j },
  ] = await Promise.all([
    supabase.from("vtc_profiles").select("*", { count: "exact", head: true }).eq("driver_verification_status", "pending"),
    supabase.from("vtc_profiles").select("user_id"),
    supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED").is("picker_id", null).lt("created_at", limit48h),
    supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED").is("picker_id", null).lt("created_at", limit24h),
    supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED").is("picker_id", null).lt("created_at", limit12h),
    supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "PUBLISHED").is("picker_id", null).lt("created_at", limit6h),
    supabase.from("rides").select("*", { count: "exact", head: true }).eq("status", "CANCELLED").gte("updated_at", since),
  ]);

  const vtcIds = [...new Set((allVtcUserIds || []).map((p: { user_id: string }) => p.user_id).filter(Boolean))];
  let inactifsCount = 0;
  let actifsM1InactifsMCount = 0;
  if (vtcIds.length > 0) {
    const { data: recentRides } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", THIRTY_DAYS_AGO);
    const { data: recentPerso } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", THIRTY_DAYS_AGO);
    const { data: ridesM1 } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);
    const { data: persoM1 } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);
    const actifsSet = new Set<string>();
    (recentRides || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
      if (r.creator_id) actifsSet.add(r.creator_id);
      if (r.picker_id) actifsSet.add(r.picker_id);
    });
    (recentPerso || []).forEach((r: { driver_id?: string }) => r.driver_id && actifsSet.add(r.driver_id));
    const actifsM1Set = new Set<string>();
    (ridesM1 || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
      if (r.creator_id) actifsM1Set.add(r.creator_id);
      if (r.picker_id) actifsM1Set.add(r.picker_id);
    });
    (persoM1 || []).forEach((r: { driver_id?: string }) => r.driver_id && actifsM1Set.add(r.driver_id));
    inactifsCount = vtcIds.filter((id) => !actifsSet.has(id)).length;
    actifsM1InactifsMCount = vtcIds.filter((id) => actifsM1Set.has(id) && !actifsSet.has(id)).length;
  }

  return {
    chauffeursEnAttenteValidation: chauffeursPending ?? 0,
    documentsExpires: 0,
    comptesInactifs30j: inactifsCount,
    annoncesSansReponse: annoncesSansReponse ?? 0,
    annoncesSansReponse24h: annonces24h ?? 0,
    annoncesSansReponse12h: annonces12h ?? 0,
    annoncesSansReponse6h: annonces6h ?? 0,
    chauffeursActifsM1InactifsM: actifsM1InactifsMCount,
    coursesAnnulees7j: coursesAnnulees7j ?? 0,
  };
}

export async function getSanteReseau(stats: AdminDashboardStats, period: DashboardPeriod = 7): Promise<SanteReseau> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const totalChauffeurs = stats.chauffeursTotal || 1;
  const chauffeursActifsPct = Math.round((stats.actifs7j / totalChauffeurs) * 100);
  const annoncesPubliees = stats.annoncesPubliees7j || 1;
  const tauxConversionAnnoncesCourses = Math.round((stats.annoncesPrises7j / annoncesPubliees) * 100);
  const totalCourses = stats.coursesPerso + stats.coursesPublic || 1;
  const tauxUtilisationReseauPublic = Math.round((stats.coursesPublic / totalCourses) * 100);

  const [{ count: nouveauxInscrits7j }, { data: nouveaux30j }, { data: rides30jCreators }] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("users").select("id").gte("created_at", THIRTY_DAYS_AGO),
    supabase.from("rides").select("creator_id").gte("created_at", THIRTY_DAYS_AGO),
  ]);
  const ids30j = new Set((nouveaux30j || []).map((u: { id: string }) => u.id));
  const creators30j = new Set((rides30jCreators || []).map((r: { creator_id: string }) => r.creator_id));
  const nouveauxAvecAnnonce = [...ids30j].filter((id) => creators30j.has(id)).length;
  const total30j = ids30j.size || 1;
  const tauxActivationNouveauxInscrits30j = Math.round((nouveauxAvecAnnonce / total30j) * 100);

  return {
    chauffeursActifsPct,
    tauxConversionAnnoncesCourses,
    tauxUtilisationReseauPublic,
    nouveauxInscrits7j: nouveauxInscrits7j ?? 0,
    tauxActivationNouveauxInscrits30j,
  };
}

export async function getGMVMetrics(period: DashboardPeriod = 7): Promise<GMVMetrics> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const [
    { data: ridesAll },
    { data: ridesPeriod },
    { data: rides7j },
    { data: rides30j },
    { data: rides30jPrev },
    { data: persoAll },
    { data: persoPeriod },
    { data: perso7j },
    { data: perso30j },
    { data: perso30jPrev },
    { data: rides30jActifs },
    { data: perso30jActifs },
  ] = await Promise.all([
    supabase.from("rides").select("price_cents").eq("status", "COMPLETED").not("price_cents", "is", null),
    supabase.from("rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", since).not("price_cents", "is", null),
    supabase.from("rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", SEVEN_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", THIRTY_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", SIXTY_DAYS_AGO).lt("completed_at", THIRTY_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("personal_rides").select("price_cents").eq("status", "COMPLETED").not("price_cents", "is", null),
    supabase.from("personal_rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", since).not("price_cents", "is", null),
    supabase.from("personal_rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", SEVEN_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("personal_rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", THIRTY_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("personal_rides").select("price_cents").eq("status", "COMPLETED").gte("completed_at", SIXTY_DAYS_AGO).lt("completed_at", THIRTY_DAYS_AGO).not("price_cents", "is", null),
    supabase.from("rides").select("creator_id, picker_id").gte("updated_at", THIRTY_DAYS_AGO),
    supabase.from("personal_rides").select("driver_id").gte("updated_at", THIRTY_DAYS_AGO),
  ]);

  const sum = (arr: { price_cents?: number | null }[] | null) => (arr || []).reduce((a, r) => a + (Number(r.price_cents) || 0), 0);
  const gmvTotalCents = sum(ridesAll) + sum(persoAll);
  const gmvPeriodCents = sum(ridesPeriod) + sum(persoPeriod);
  const gmv7jCents = sum(rides7j) + sum(perso7j);
  const gmv30jCents = sum(rides30j) + sum(perso30j);
  const gmv30jPrecedentCents = sum(rides30jPrev) + sum(perso30jPrev);
  const countAll = (ridesAll?.length ?? 0) + (persoAll?.length ?? 0);
  const gmvMoyenneParCourseCents = countAll > 0 ? Math.round(gmvTotalCents / countAll) : 0;
  const gmv30jQuatre = gmv30jCents / 4;
  const evolution7jVs30jPct = gmv30jQuatre > 0 ? Math.round(((gmv7jCents - gmv30jQuatre) / gmv30jQuatre) * 100) : 0;
  const evolutionVsMoisPrecedentPct = gmv30jPrecedentCents > 0 ? Math.round(((gmv30jCents - gmv30jPrecedentCents) / gmv30jPrecedentCents) * 100) : 0;

  const actifs30jSet = new Set<string>();
  (rides30jActifs || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifs30jSet.add(r.creator_id);
    if (r.picker_id) actifs30jSet.add(r.picker_id);
  });
  (perso30jActifs || []).forEach((r: { driver_id?: string }) => r.driver_id && actifs30jSet.add(r.driver_id));
  const actifs30j = actifs30jSet.size;
  const revenuMoyenParChauffeurActif30jCents = actifs30j > 0 ? Math.round(gmv30jCents / actifs30j) : 0;

  return {
    gmvTotalCents,
    gmvPeriodCents,
    gmv7jCents,
    gmv30jCents,
    gmv30jPrecedentCents,
    gmvMoyenneParCourseCents,
    evolution7jVs30jPct,
    evolutionVsMoisPrecedentPct,
    revenuMoyenParChauffeurActif30jCents,
    actifs30j,
  };
}

/** Un seul passage requêtes + agrégation en mémoire (au lieu de N × 5 requêtes). */
export async function getActivite7jEvolution(period: DashboardPeriod = 7): Promise<ActiviteJour[]> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const now = new Date();

  type Bucket = { key: string; start: Date; end: Date; label: string; dateStr: string };
  const buckets: Bucket[] = [];
  if (period === 90) {
    for (let w = 11; w >= 0; w--) {
      const end = new Date(now);
      end.setDate(end.getDate() - w * 7);
      end.setHours(0, 0, 0, 0);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      buckets.push({ key: `S${12 - w}`, start, end, label: `S${12 - w}`, dateStr: start.toISOString().slice(0, 10) });
    }
  } else {
    const n = period === 7 ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      buckets.push({ key: d.toISOString().slice(0, 10), start: d, end: next, label, dateStr: d.toISOString().slice(0, 10) });
    }
  }

  const [
    { data: ridesCreated },
    { data: ridesCompleted },
    { data: usersCreated },
    { data: persoCompleted },
  ] = await Promise.all([
    supabase.from("rides").select("created_at").gte("created_at", since),
    supabase.from("rides").select("completed_at").eq("status", "COMPLETED").gte("completed_at", since).not("completed_at", "is", null),
    supabase.from("users").select("created_at").gte("created_at", since),
    supabase.from("personal_rides").select("completed_at").eq("status", "COMPLETED").gte("completed_at", since).not("completed_at", "is", null),
  ]);

  const getBucketIndex = (ts: string): number => {
    const t = new Date(ts).getTime();
    const idx = buckets.findIndex((b) => t >= b.start.getTime() && t < b.end.getTime());
    return idx;
  };

  const annoncesByBucket = new Array(buckets.length).fill(0);
  (ridesCreated || []).forEach((r: { created_at: string }) => {
    const i = getBucketIndex(r.created_at);
    if (i >= 0) annoncesByBucket[i]++;
  });
  const coursesByBucket = new Array(buckets.length).fill(0);
  (ridesCompleted || []).forEach((r: { completed_at: string }) => {
    const i = getBucketIndex(r.completed_at);
    if (i >= 0) coursesByBucket[i]++;
  });
  (persoCompleted || []).forEach((r: { completed_at: string }) => {
    const i = getBucketIndex(r.completed_at);
    if (i >= 0) coursesByBucket[i]++;
  });
  const inscritsByBucket = new Array(buckets.length).fill(0);
  (usersCreated || []).forEach((u: { created_at: string }) => {
    const i = getBucketIndex(u.created_at);
    if (i >= 0) inscritsByBucket[i]++;
  });

  return buckets.map((b, i) => ({
    date: b.dateStr,
    label: b.label,
    annonces: annoncesByBucket[i] ?? 0,
    coursesCompletees: coursesByBucket[i] ?? 0,
    nouveauxInscrits: inscritsByBucket[i] ?? 0,
  }));
}

export async function getChauffeursInactifs(limit = 15): Promise<ChauffeurInactif[]> {
  const supabase = getSupabaseServer();
  const { data: profiles } = await supabase.from("vtc_profiles").select("user_id, updated_at");
  const vtcUsers = (profiles || []).map((p: { user_id: string; updated_at: string }) => ({ user_id: p.user_id, profile_updated: p.updated_at }));
  if (vtcUsers.length === 0) return [];

  const { data: rides } = await supabase.from("rides").select("creator_id, picker_id, updated_at").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: perso } = await supabase.from("personal_rides").select("driver_id, updated_at").gte("updated_at", THIRTY_DAYS_AGO);
  const lastActivityByUser: Record<string, string> = {};
  (rides || []).forEach((r: { creator_id?: string; picker_id?: string | null; updated_at: string }) => {
    if (r.creator_id && (!lastActivityByUser[r.creator_id] || r.updated_at > lastActivityByUser[r.creator_id])) lastActivityByUser[r.creator_id] = r.updated_at;
    if (r.picker_id && (!lastActivityByUser[r.picker_id] || r.updated_at > lastActivityByUser[r.picker_id])) lastActivityByUser[r.picker_id] = r.updated_at;
  });
  (perso || []).forEach((r: { driver_id?: string; updated_at: string }) => {
    if (r.driver_id && (!lastActivityByUser[r.driver_id] || r.updated_at > lastActivityByUser[r.driver_id])) lastActivityByUser[r.driver_id] = r.updated_at;
  });

  const inactifs = vtcUsers
    .map((p) => ({ user_id: p.user_id, last_activity: lastActivityByUser[p.user_id] || p.profile_updated }))
    .filter((p) => new Date(p.last_activity) < new Date(THIRTY_DAYS_AGO))
    .sort((a, b) => new Date(a.last_activity).getTime() - new Date(b.last_activity).getTime())
    .slice(0, limit);

  const ids = inactifs.map((x) => x.user_id);
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", ids);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return inactifs.map((p) => ({
    user_id: p.user_id,
    email: userMap.get(p.user_id)?.email ?? "",
    full_name: userMap.get(p.user_id)?.full_name ?? null,
    last_activity: p.last_activity,
  }));
}

/** Temps moyen de prise d'annonce (proxy: updated_at - created_at, plafonné à 48h pour éviter biais des courses complétées). */
function heuresPrisePlafonnees(createdAt: string, updatedAt: string): number {
  const h = (new Date(updatedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return Math.min(h, MAX_HEURES_PRISE_POUR_MOYENNE);
}

export async function getTempsMoyenPriseAnnonce7j(period: DashboardPeriod = 7): Promise<TempsMoyenPrise> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const { data } = await supabase
    .from("rides")
    .select("created_at, updated_at")
    .not("picker_id", "is", null)
    .gte("created_at", since);
  if (!data?.length) return { heures: 0, objectif4h: true, danger12h: false };
  const heuresList = (data as { created_at: string; updated_at: string }[]).map((r) => heuresPrisePlafonnees(r.created_at, r.updated_at));
  const heures = heuresList.reduce((a, b) => a + b, 0) / heuresList.length;
  return {
    heures: Math.round(heures * 10) / 10,
    objectif4h: heures <= 4,
    danger12h: heures > 12,
  };
}

/** Chauffeurs à risque : actifs M-1, inactifs M, ou baisse activité > 50%. */
export async function getChauffeursRisque(limit = 20): Promise<ChauffeurRisque[]> {
  const supabase = getSupabaseServer();
  const { data: profiles } = await supabase.from("vtc_profiles").select("user_id");
  const vtcIds = [...new Set((profiles || []).map((p: { user_id: string }) => p.user_id).filter(Boolean))];
  if (vtcIds.length === 0) return [];

  const { data: ridesM } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: ridesM1 } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);
  const { data: persoM } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: persoM1 } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);

  const mergeCounts = (...maps: Record<string, number>[]): Record<string, number> => {
    const out: Record<string, number> = {};
    maps.forEach((m) => Object.entries(m).forEach(([id, n]) => (out[id] = (out[id] || 0) + n)));
    return out;
  };
  const countRides = (rows: { creator_id?: string; picker_id?: string | null }[]) => {
    const c: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.creator_id) c[r.creator_id] = (c[r.creator_id] || 0) + 1;
      if (r.picker_id) c[r.picker_id] = (c[r.picker_id] || 0) + 1;
    });
    return c;
  };
  const countPerso = (rows: { driver_id?: string }[]) => {
    const c: Record<string, number> = {};
    rows.forEach((r) => { if (r.driver_id) c[r.driver_id] = (c[r.driver_id] || 0) + 1; });
    return c;
  };
  const actM = mergeCounts(countRides(ridesM || []), countPerso(persoM || []));
  const actM1 = mergeCounts(countRides(ridesM1 || []), countPerso(persoM1 || []));

  const result: ChauffeurRisque[] = [];
  for (const uid of vtcIds) {
    const m = actM[uid] || 0;
    const m1 = actM1[uid] || 0;
    if (m1 > 0 && m === 0) result.push({ user_id: uid, email: "", full_name: null, raison: "actif_m1_inactif_m", activite_m1: m1, activite_m: 0 });
    else if (m1 > 0 && m > 0 && m < m1 * 0.5) result.push({ user_id: uid, email: "", full_name: null, raison: "baisse_50", activite_m1: m1, activite_m: m });
  }
  const toFetch = result.slice(0, limit).map((r) => r.user_id);
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", toFetch);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return result.slice(0, limit).map((r) => ({ ...r, email: userMap.get(r.user_id)?.email ?? "", full_name: userMap.get(r.user_id)?.full_name ?? null }));
}

/** Liste des user_id des chauffeurs sans activité depuis 30j (pour filtre page Chauffeurs). */
export async function getChauffeursInactifs30jUserIds(): Promise<string[]> {
  const supabase = getSupabaseServer();
  const { data: profiles } = await supabase.from("vtc_profiles").select("user_id");
  const vtcIds = [...new Set((profiles || []).map((p: { user_id: string }) => p.user_id).filter(Boolean))];
  if (vtcIds.length === 0) return [];

  const { data: recentRides } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: recentPerso } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", THIRTY_DAYS_AGO);
  const actifsSet = new Set<string>();
  (recentRides || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifsSet.add(r.creator_id);
    if (r.picker_id) actifsSet.add(r.picker_id);
  });
  (recentPerso || []).forEach((r: { driver_id?: string }) => r.driver_id && actifsSet.add(r.driver_id));
  return vtcIds.filter((id) => !actifsSet.has(id));
}

/** Liste des user_id des chauffeurs actifs M-1 mais inactifs ce mois (pour filtre page Chauffeurs). */
export async function getChauffeursActifsM1InactifsMUserIds(): Promise<string[]> {
  const supabase = getSupabaseServer();
  const { data: profiles } = await supabase.from("vtc_profiles").select("user_id");
  const vtcIds = [...new Set((profiles || []).map((p: { user_id: string }) => p.user_id).filter(Boolean))];
  if (vtcIds.length === 0) return [];

  const { data: ridesM } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: ridesM1 } = await supabase.from("rides").select("creator_id, picker_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);
  const { data: persoM } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", THIRTY_DAYS_AGO);
  const { data: persoM1 } = await supabase.from("personal_rides").select("driver_id").gte("updated_at", SIXTY_DAYS_AGO).lt("updated_at", THIRTY_DAYS_AGO);

  const actifsM = new Set<string>();
  (ridesM || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifsM.add(r.creator_id);
    if (r.picker_id) actifsM.add(r.picker_id);
  });
  (persoM || []).forEach((r: { driver_id?: string }) => r.driver_id && actifsM.add(r.driver_id));
  const actifsM1 = new Set<string>();
  (ridesM1 || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifsM1.add(r.creator_id);
    if (r.picker_id) actifsM1.add(r.picker_id);
  });
  (persoM1 || []).forEach((r: { driver_id?: string }) => r.driver_id && actifsM1.add(r.driver_id));

  return vtcIds.filter((id) => actifsM1.has(id) && !actifsM.has(id));
}

/** Densité par ville : chauffeurs actifs, annonces sur la période, taux conversion, temps moyen prise. */
export async function getDensiteParVille(period: DashboardPeriod = 7): Promise<DensiteVille[]> {
  const supabase = getSupabaseServer();
  const since = getSince(period);
  const { data: profiles } = await supabase.from("vtc_profiles").select("user_id, zone_city");
  const villeByUser: Record<string, string> = {};
  (profiles || []).forEach((p: { user_id: string; zone_city: string | null }) => {
    const city = (p.zone_city || "").trim();
    if (city) villeByUser[p.user_id] = city;
  });
  const cities = [...new Set(Object.values(villeByUser))];
  if (cities.length === 0) return [];

  const { data: rides7j } = await supabase.from("rides").select("creator_id, picker_id, created_at, updated_at").gte("created_at", since);
  const { data: ridesClaimed7j } = await supabase.from("rides").select("creator_id, created_at, updated_at").not("picker_id", "is", null).gte("created_at", since);

  const byVille: Record<string, { actifs: Set<string>; annonces: number; prises: number; claimDeltas: number[] }> = {};
  cities.forEach((v) => (byVille[v] = { actifs: new Set(), annonces: 0, prises: 0, claimDeltas: [] }));

  (rides7j || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    const vCreator = r.creator_id ? villeByUser[r.creator_id] : null;
    const vPicker = r.picker_id ? villeByUser[r.picker_id] : null;
    if (vCreator) {
      byVille[vCreator].annonces += 1;
      byVille[vCreator].actifs.add(r.creator_id!);
    }
    if (vPicker) byVille[vPicker].actifs.add(r.picker_id!);
  });
  (ridesClaimed7j || []).forEach((r: { creator_id?: string; created_at: string; updated_at: string }) => {
    const v = villeByUser[r.creator_id!];
    if (v) {
      byVille[v].prises += 1;
      byVille[v].claimDeltas.push(heuresPrisePlafonnees(r.created_at, r.updated_at));
    }
  });

  return cities.map((ville) => {
    const d = byVille[ville];
    const tauxConversion = d.annonces > 0 ? Math.round((d.prises / d.annonces) * 100) : 0;
    const tempsMoyen = d.claimDeltas.length > 0 ? d.claimDeltas.reduce((a, b) => a + b, 0) / d.claimDeltas.length : 0;
    return {
      ville,
      chauffeursActifs: d.actifs.size,
      annonces7j: d.annonces,
      tauxConversion,
      tempsMoyenPriseHeures: Math.round(tempsMoyen * 10) / 10,
    };
  }).sort((a, b) => b.chauffeursActifs - a.chauffeursActifs).slice(0, 15);
}

export async function getAdminDashboardStats(period: DashboardPeriod = 7): Promise<AdminDashboardStats> {
  const supabase = getSupabaseServer();
  const since = getSince(period);

  const [
    { count: chauffeursTotal },
    { count: chauffeursVerifies },
    { data: actifsData },
    { count: annoncesPubliees7j },
    { count: annoncesPrises7j },
    { count: demandesSite7j },
    { count: demandesSiteTotal },
    { data: ridesKm },
    { data: persoKm },
    { count: nombreGroupes },
    { data: groupMembers },
    { count: coursesPerso },
    { count: coursesPublic },
  ] = await Promise.all([
    supabase.from("vtc_profiles").select("*", { count: "exact", head: true }),
    supabase.from("vtc_profiles").select("*", { count: "exact", head: true }).eq("driver_verification_status", "approved"),
    supabase.from("rides").select("creator_id, picker_id").or(`created_at.gte.${since},updated_at.gte.${since}`),
    supabase.from("rides").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("rides").select("*", { count: "exact", head: true }).not("picker_id", "is", null).gte("updated_at", since),
    supabase.from("driver_ride_requests").select("*", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("driver_ride_requests").select("*", { count: "exact", head: true }),
    supabase.from("rides").select("distance_km").eq("status", "COMPLETED").not("distance_km", "is", null),
    supabase.from("personal_rides").select("distance_km").eq("status", "COMPLETED").not("distance_km", "is", null),
    supabase.from("groups").select("*", { count: "exact", head: true }),
    supabase.from("group_members").select("group_id"),
    supabase.from("personal_rides").select("*", { count: "exact", head: true }),
    supabase.from("rides").select("*", { count: "exact", head: true }),
  ]);

  const actifIds = new Set<string>();
  (actifsData || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) actifIds.add(r.creator_id);
    if (r.picker_id) actifIds.add(r.picker_id);
  });

  const kmRides = (ridesKm || []).map((r: { distance_km?: number | null }) => Number(r.distance_km)).filter((n: number) => !isNaN(n));
  const kmPerso = (persoKm || []).map((r: { distance_km?: number | null }) => Number(r.distance_km)).filter((n: number) => !isNaN(n));
  const allKm = [...kmRides, ...kmPerso];
  const kmMoyen = allKm.length > 0 ? allKm.reduce((a, b) => a + b, 0) / allKm.length : 0;

  const nbGroupes = nombreGroupes ?? 0;
  const nbMembers = (groupMembers || []).length;
  const moyenneChauffeursParGroupe = nbGroupes > 0 ? nbMembers / nbGroupes : 0;

  return {
    chauffeursTotal: chauffeursTotal ?? 0,
    chauffeursVerifies: chauffeursVerifies ?? 0,
    actifs7j: actifIds.size,
    annoncesPubliees7j: annoncesPubliees7j ?? 0,
    annoncesPrises7j: annoncesPrises7j ?? 0,
    demandesSite7j: demandesSite7j ?? 0,
    demandesSiteTotal: demandesSiteTotal ?? 0,
    kmMoyen: Math.round(kmMoyen * 10) / 10,
    nombreGroupes: nbGroupes,
    moyenneChauffeursParGroupe: Math.round(moyenneChauffeursParGroupe * 10) / 10,
    coursesPerso: coursesPerso ?? 0,
    coursesPublic: coursesPublic ?? 0,
  };
}

export async function getDistributionVille(): Promise<VilleCount[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from("vtc_profiles").select("zone_city").not("zone_city", "is", null);
  const byCity: Record<string, number> = {};
  (data || []).forEach((r: { zone_city?: string | null }) => {
    const city = (r.zone_city || "").trim();
    if (city) byCity[city] = (byCity[city] || 0) + 1;
  });
  return Object.entries(byCity)
    .map(([ville, count]) => ({ ville, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

export async function getTop10ChauffeursCourses(): Promise<TopChauffeur[]> {
  const supabase = getSupabaseServer();
  const [rides, perso] = await Promise.all([
    supabase.from("rides").select("creator_id, picker_id").eq("status", "COMPLETED"),
    supabase.from("personal_rides").select("driver_id").eq("status", "COMPLETED"),
  ]);
  const countByUser: Record<string, number> = {};
  (rides.data || []).forEach((r: { creator_id?: string; picker_id?: string | null }) => {
    if (r.creator_id) countByUser[r.creator_id] = (countByUser[r.creator_id] || 0) + 1;
    if (r.picker_id) countByUser[r.picker_id] = (countByUser[r.picker_id] || 0) + 1;
  });
  (perso.data || []).forEach((r: { driver_id?: string }) => {
    if (r.driver_id) countByUser[r.driver_id] = (countByUser[r.driver_id] || 0) + 1;
  });
  const sorted = Object.entries(countByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([user_id, count]) => ({ user_id, count }));
  if (sorted.length === 0) return [];
  const userIds = sorted.map((s) => s.user_id);
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return sorted.map(({ user_id, count }) => ({
    user_id,
    email: userMap.get(user_id)?.email ?? "",
    full_name: userMap.get(user_id)?.full_name ?? "",
    count,
  }));
}

export async function getTop10ChauffeursPublications(): Promise<TopChauffeur[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from("rides").select("creator_id");
  const countByUser: Record<string, number> = {};
  (data || []).forEach((r: { creator_id?: string }) => {
    if (r.creator_id) countByUser[r.creator_id] = (countByUser[r.creator_id] || 0) + 1;
  });
  const sorted = Object.entries(countByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([user_id, count]) => ({ user_id, count }));
  if (sorted.length === 0) return [];
  const userIds = sorted.map((s) => s.user_id);
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return sorted.map(({ user_id, count }) => ({
    user_id,
    email: userMap.get(user_id)?.email ?? "",
    full_name: userMap.get(user_id)?.full_name ?? "",
    count,
  }));
}

export async function getDerniersUtilisateurs(): Promise<DernierUtilisateur[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from("users").select("id, email, full_name, created_at").order("created_at", { ascending: false }).limit(10);
  return (data || []).map((u: { id: string; email: string; full_name: string | null; created_at: string }) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    created_at: u.created_at,
  }));
}

const ACTION_LABELS: Record<string, string> = {
  RIDE_PUBLISHED: "Annonce publiée",
  RIDE_CLAIMED: "Course prise",
  RIDE_COMPLETED: "Course terminée",
  RIDE_CANCELLED: "Course annulée",
  RIDE_DELETED: "Annonce supprimée",
  PERSONAL_RIDE_ADDED: "Course perso ajoutée",
  CREDIT_EARNED: "Crédit gagné",
  CREDIT_SPENT: "Crédit utilisé",
  BADGE_EARNED: "Badge débloqué",
  GROUP_JOINED: "A rejoint un groupe",
  GROUP_CREATED: "Groupe créé",
  QUOTE_ACCEPTED: "Devis accepté",
  QUOTE_REFUSED: "Devis refusé",
};

export async function getDerniereActivite(limit = 10): Promise<ActiviteItem[]> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("activity_log")
    .select("id, user_id, action_type, description, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data?.length) return [];
  const userIds = [...new Set(data.map((a: { user_id: string }) => a.user_id))];
  const { data: users } = await supabase.from("users").select("id, email, full_name").in("id", userIds);
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return data.map((a: { id: string; user_id: string; action_type: string; description: string; created_at: string }) => ({
    id: a.id,
    user_id: a.user_id,
    email: userMap.get(a.user_id)?.email ?? "",
    full_name: userMap.get(a.user_id)?.full_name ?? null,
    action_type: a.action_type,
    action_label: getActionLabel(a.action_type),
    description: a.description,
    created_at: a.created_at,
  }));
}

export function getActionLabel(actionType: string): string {
  return ACTION_LABELS[actionType] ?? actionType;
}
