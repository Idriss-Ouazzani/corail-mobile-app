import {
  getAdminDashboardStats,
  getDistributionVille,
  getTop10ChauffeursCourses,
  getTop10ChauffeursPublications,
  getDerniersUtilisateurs,
  getDerniereActivite,
  getAlertesATraiter,
  getSanteReseau,
  getGMVMetrics,
  getActivite7jEvolution,
  getChauffeursInactifs,
  getTempsMoyenPriseAnnonce7j,
  getChauffeursRisque,
  getDensiteParVille,
  type DashboardPeriod,
} from "@/lib/admin-dashboard";
import {
  DistributionVille,
  DistributionPersoPublic,
  TopChauffeursTable,
  DerniersUtilisateursTable,
  DerniereActiviteList,
  AlertesATraiterBlock,
  SanteReseauCards,
  GMVCards,
  Activite7jChart,
  ChauffeursInactifsTable,
  TempsMoyenPriseBlock,
  ChauffeursRisqueTable,
  DensiteVilleTable,
} from "./DashboardCharts";
import { Suspense } from "react";
import { PeriodFilter } from "./PeriodFilter";

function parsePeriod(period?: string | null): DashboardPeriod {
  const p = Number(period);
  if (p === 7 || p === 30 || p === 90) return p;
  return 30;
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const [
    stats,
    distributionVille,
    top10Courses,
    top10Publications,
    derniersUtilisateurs,
    derniereActivite,
    alertes,
    gmv,
    activite7j,
    chauffeursInactifs,
    tempsMoyenPrise,
    chauffeursRisque,
    densiteParVille,
  ] = await Promise.all([
    getAdminDashboardStats(period),
    getDistributionVille(),
    getTop10ChauffeursCourses(),
    getTop10ChauffeursPublications(),
    getDerniersUtilisateurs(),
    getDerniereActivite(10),
    getAlertesATraiter(period),
    getGMVMetrics(period),
    getActivite7jEvolution(period),
    getChauffeursInactifs(15),
    getTempsMoyenPriseAnnonce7j(period),
    getChauffeursRisque(20),
    getDensiteParVille(period),
  ]);

  const santeReseau = await getSanteReseau(stats, period);

  return (
    <div className="space-y-12">
      <div className="border-b border-[var(--border)] pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Pilotage Corail</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Tableau de bord de pilotage : décisions, santé réseau, dynamique économique.</p>
      </div>

      {/* ═══ Section 1 – À TRAITER (prioritaire, ne dépend pas de la période) ═══ */}
      <section>
        <AlertesATraiterBlock alertes={alertes} />
      </section>

      {/* Filtre période : s’applique aux blocs ci‑dessous (santé, GMV, dynamique, densité, etc.) */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">Période des données ci‑dessous</span>
        <Suspense fallback={<div className="h-9 w-32 animate-pulse rounded-lg bg-[var(--muted)]" />}>
          <PeriodFilter currentPeriod={period} />
        </Suspense>
      </div>

      {/* ═══ Section 2 – Santé réseau & GMV (un seul bloc rectangulaire) ═══ */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
          <span className="h-1.5 w-10 rounded-full bg-emerald-500" aria-hidden />
          Santé réseau & GMV
        </h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="space-y-6">
            <GMVCards gmv={gmv} period={period} />
            <SanteReseauCards sante={santeReseau} period={period} />
            <div className="border-t border-[var(--border)] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Répartition public / perso</h3>
              <DistributionPersoPublic stats={stats} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 3 – Dynamique (temps moyen prise + activité 7j + géo) ═══ */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
          <span className="h-1.5 w-10 rounded-full bg-[var(--primary)]" aria-hidden />
          Dynamique
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Activité {period === 7 ? "7 derniers jours" : period === 30 ? "30 derniers jours" : "12 dernières semaines"}
            </h3>
            <div className="flex min-h-[280px] items-center justify-center py-4">
              <Activite7jChart data={activite7j} />
            </div>
          </div>
          <div className="space-y-4">
            <TempsMoyenPriseBlock data={tempsMoyenPrise} period={period} />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Répartition géographique</h3>
              <DistributionVille data={distributionVille} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 4 – Densité par ville (identifier une ville forte) ═══ */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
          <span className="h-1.5 w-10 rounded-full bg-sky-500" aria-hidden />
          Densité par ville
        </h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Chauffeurs actifs, annonces {period}j, taux conversion, temps moyen de prise. Objectif : identifier une ville forte à densifier.
          </p>
          <DensiteVilleTable items={densiteParVille} period={period} />
        </div>
      </section>

      {/* ═══ Section 5 – Leadership (top, inactifs, à risque) ═══ */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
          <span className="h-1.5 w-10 rounded-full bg-amber-500" aria-hidden />
          Leadership réseau
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Top 10 chauffeurs (courses)</h3>
            <TopChauffeursTable items={top10Courses} title="Courses" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Top 10 chauffeurs (annonces)</h3>
            <TopChauffeursTable items={top10Publications} title="Annonces" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Chauffeurs inactifs 30j</h3>
            <ChauffeursInactifsTable items={chauffeursInactifs} />
          </div>
        </div>
        <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Chauffeurs à risque (actifs M-1 inactifs M ou baisse &gt; 50%) — Action : les contacter</h3>
          <ChauffeursRisqueTable items={chauffeursRisque} />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Groupes</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{stats.nombreGroupes}</span> groupes ·{" "}
            <span className="font-semibold text-[var(--foreground)]">{stats.moyenneChauffeursParGroupe.toFixed(1)}</span> chauffeurs / groupe en moyenne
          </p>
        </div>
      </section>

      {/* ═══ Section 6 – Log temps réel ═══ */}
      <section className="space-y-6">
        <h2 className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
          <span className="h-1.5 w-10 rounded-full bg-[var(--muted-foreground)]" aria-hidden />
          Log temps réel
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Dernière activité</h3>
            <DerniereActiviteList items={derniereActivite} />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Derniers inscrits</h3>
            <DerniersUtilisateursTable items={derniersUtilisateurs} />
          </div>
        </div>
      </section>
    </div>
  );
}
