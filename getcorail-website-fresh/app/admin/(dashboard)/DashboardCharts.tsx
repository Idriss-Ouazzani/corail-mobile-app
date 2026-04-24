"use client";

import Link from "next/link";
import {
  AlertCircle,
  Clock,
  FileWarning,
  Users,
  ChevronRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import type {
  AdminDashboardStats,
  VilleCount,
  TopChauffeur,
  DernierUtilisateur,
  ActiviteItem,
  AlertesATraiter,
  SanteReseau,
  GMVMetrics,
  ActiviteJour,
  ChauffeurInactif,
  ChauffeurRisque,
  DensiteVille,
  TempsMoyenPrise,
} from "@/lib/admin-dashboard";

const COLORS = ["#0ea5e9", "#06b6d4", "#14b8a6", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#ec4899", "#8b5cf6"];

export type DashboardPeriod = 7 | 30 | 90;
export function getPeriodLabel(period: DashboardPeriod): string {
  return period === 7 ? "7j" : period === 30 ? "30j" : "90j";
}

export function DistributionVille({ data }: { data: VilleCount[] }) {
  if (!data.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucune donnée ville.</p>;
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
          <XAxis dataKey="ville" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
          <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Chauffeurs" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionPersoPublic({ stats }: { stats: AdminDashboardStats }) {
  const total = stats.coursesPublic + stats.coursesPerso;
  const data = [
    { name: "Réseau public", value: stats.coursesPublic, color: "var(--chart-1)" },
    { name: "Courses perso", value: stats.coursesPerso, color: "var(--chart-2)" },
  ].filter((d) => d.value > 0);
  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg bg-[var(--muted)]/20">
        <p className="text-sm text-[var(--muted-foreground)]">Aucune course.</p>
      </div>
    );
  }
  const renderTooltip = ({ payload }: { payload?: { name: string; value: number }[] }) => {
    if (!payload?.length) return null;
    const p = payload[0];
    const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-md">
        <span className="font-medium">{p.name}</span>
        <span className="ml-2 text-[var(--muted-foreground)]">
          {p.value} ({pct} %)
        </span>
      </div>
    );
  };
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={data[i].color} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            formatter={(value, entry) => (
              <span className="text-xs font-medium text-[var(--foreground)]">
                {value}
                {total > 0 && (
                  <span className="ml-1.5 text-[var(--muted-foreground)]">
                    ({Math.round(((entry?.payload?.value ?? 0) / total) * 100)} %)
                  </span>
                )}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopChauffeursTable({ items, title }: { items: TopChauffeur[]; title: string }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucun chauffeur.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Nom / Email</th>
            <th className="pb-2 font-medium">{title}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={r.user_id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">{i + 1}</td>
              <td className="py-2 pr-4">
                <div>{r.full_name || "—"}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{r.email}</div>
              </td>
              <td className="py-2 font-semibold">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DerniersUtilisateursTable({ items }: { items: DernierUtilisateur[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucun utilisateur.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="pb-2 pr-4 font-medium">Email</th>
            <th className="pb-2 pr-4 font-medium">Nom</th>
            <th className="pb-2 font-medium">Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">{r.email}</td>
              <td className="py-2 pr-4">{r.full_name || "—"}</td>
              <td className="py-2 text-[var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "À l'instant";
  if (sec < 3600) return `Il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`;
  if (sec < 604800) return `Il y a ${Math.floor(sec / 86400)} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function DerniereActiviteList({ items }: { items: ActiviteItem[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucune activité récente.</p>;
  return (
    <ul className="space-y-0">
      {items.map((a, i) => (
        <li key={a.id} className="flex gap-4 py-3 border-b border-[var(--border)] last:border-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-semibold text-[var(--muted-foreground)]">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {a.action_label}
              <span className="ml-1.5 font-normal text-[var(--muted-foreground)]">· {(a.full_name || a.email || "—").slice(0, 30)}</span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{formatRelativeTime(a.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const ALERT_ITEMS: {
  key: keyof AlertesATraiter;
  label: string;
  href: string | null;
  priority: "high" | "medium" | "low";
  icon: typeof AlertCircle;
  tooltip?: string;
}[] = [
  { key: "chauffeursEnAttenteValidation", label: "Chauffeurs en attente de validation", href: "/admin/chauffeurs?status=pending", priority: "high", icon: Users },
  { key: "documentsExpires", label: "Documents expirés", href: null, priority: "high", icon: FileWarning },
  { key: "annoncesSansReponse24h", label: "Annonces sans réponse > 24h", href: null, priority: "high", icon: Clock },
  { key: "annoncesSansReponse12h", label: "Annonces sans réponse > 12h", href: null, priority: "medium", icon: Clock },
  { key: "annoncesSansReponse6h", label: "Annonces sans réponse > 6h", href: null, priority: "low", icon: Clock },
  {
    key: "chauffeursActifsM1InactifsM",
    label: "Actifs M-1, inactifs ce mois",
    href: "/admin/chauffeurs?filter=actifs_m1_inactifs_m",
    priority: "high",
    icon: Users,
    tooltip: "Chauffeurs ayant eu au moins une activité (course ou perso) le mois dernier, mais aucune ce mois-ci. À contacter pour les réengager.",
  },
  {
    key: "comptesInactifs30j",
    label: "Comptes inactifs 30j",
    href: "/admin/chauffeurs?filter=inactifs_30j",
    priority: "medium",
    icon: Users,
    tooltip: "Chauffeurs n'ayant eu aucune activité (course réseau ou perso) depuis 30 jours. Inclut les profils récemment créés sans aucune course.",
  },
  { key: "coursesAnnulees7j", label: "Courses annulées 7j", href: null, priority: "low", icon: AlertCircle },
];

/** Zone décision prioritaire : design soigné, regroupé par priorité, icônes */
export function AlertesATraiterBlock({ alertes }: { alertes: AlertesATraiter }) {
  const items = ALERT_ITEMS.map(({ key, label, href, priority, icon, tooltip }) => ({
    label,
    value: alertes[key] as number,
    href,
    priority,
    Icon: icon,
    tooltip,
  }));
  const withValue = items.filter((i) => i.value > 0);
  const total = withValue.reduce((s, i) => s + i.value, 0);

  const high = withValue.filter((i) => i.priority === "high");
  const medium = withValue.filter((i) => i.priority === "medium");
  const low = withValue.filter((i) => i.priority === "low");
  const groups: { label: string; items: typeof withValue; bgClass: string }[] = [
    { label: "Priorité haute", items: high, bgClass: "bg-red-500/5" },
    { label: "Priorité moyenne", items: medium, bgClass: "bg-amber-500/5" },
    { label: "Priorité basse", items: low, bgClass: "bg-[var(--muted)]/20" },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
      <div className="bg-[var(--muted)]/30 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">À traiter</h3>
          {total > 0 ? (
            <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">{total}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
              <CheckCircle2 className="h-4 w-4" />
              Aucune alerte
            </span>
          )}
        </div>
      </div>
      {total === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-[var(--muted-foreground)]">
          Aucune action requise pour le moment.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {groups.map((group) => (
            <div key={group.label} className={group.bgClass}>
              <div className="px-6 pt-4 pb-1">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {group.label}
                </p>
              </div>
              {group.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 px-6 py-3 transition-colors hover:opacity-90"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                    <item.Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                    {item.tooltip && (
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex shrink-0 cursor-help text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                            <Info className="h-4 w-4" strokeWidth={1.5} aria-label="Explication" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {item.tooltip}
                        </TooltipContent>
                      </UITooltip>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums text-[var(--foreground)]">{item.value}</span>
                    {item.href && (
                      <Link
                        href={item.href}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        aria-label="Voir"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Indicateurs santé réseau */
export function SanteReseauCards({ sante, period = 30 }: { sante: SanteReseau; period?: DashboardPeriod }) {
  const p = getPeriodLabel(period);
  const activationOk = sante.tauxActivationNouveauxInscrits30j >= 40;
  const cards: { label: string; value: string | number; sub: string; warn?: boolean; tooltip?: string }[] = [
    { label: `Chauffeurs actifs (${p})`, value: `${sante.chauffeursActifsPct}%`, sub: "du total" },
    { label: "Taux conversion annonces → courses", value: `${sante.tauxConversionAnnoncesCourses}%`, sub: p },
    { label: "Taux réseau public", value: `${sante.tauxUtilisationReseauPublic}%`, sub: "vs perso" },
    { label: `Nouveaux inscrits ${p}`, value: sante.nouveauxInscrits7j, sub: "" },
    {
      label: "Taux d'activation nouveaux inscrits 30j",
      value: `${sante.tauxActivationNouveauxInscrits30j}%`,
      sub: activationOk ? "≥ 40% OK" : "< 40%, problème onboarding",
      warn: !activationOk,
      tooltip:
        "Part des nouveaux inscrits (30 derniers jours) ayant publié au moins une annonce. En dessous de 40 %, l'onboarding ou l'engagement est à améliorer.",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm ${c.warn ? "border-amber-500/50 bg-amber-500/5" : ""}`}>
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">{c.label}</p>
            {c.tooltip && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0 cursor-help text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-label="Explication" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {c.tooltip}
                </TooltipContent>
              </UITooltip>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">{c.value}</p>
          {c.sub && <p className={`text-xs ${c.warn ? "text-amber-600 dark:text-amber-400" : "text-[var(--muted-foreground)]"}`}>{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** GMV : valeur économique. Focus central sur GMV total + revenu moyen/chauffeur actif + croissance */
export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

export function GMVCards({ gmv, period = 30 }: { gmv: GMVMetrics; period?: DashboardPeriod }) {
  const periodLabel = getPeriodLabel(period);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[var(--primary)]/30 bg-[var(--card)] p-6 shadow-md">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">GMV (période sélectionnée · {periodLabel})</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-[var(--foreground)]">{formatEuros(gmv.gmvPeriodCents)}</p>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">GMV total (toutes périodes)</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">{formatEuros(gmv.gmvTotalCents)}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Revenu moyen / chauffeur actif 30j</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">{formatEuros(gmv.revenuMoyenParChauffeurActif30jCents)}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{gmv.actifs30j} actifs 30j</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">GMV 30j</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">{formatEuros(gmv.gmv30jCents)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Évolution vs mois précédent</p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${gmv.evolutionVsMoisPrecedentPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {gmv.evolutionVsMoisPrecedentPct >= 0 ? "+" : ""}{gmv.evolutionVsMoisPrecedentPct}%
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Valeur moyenne / course</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">{formatEuros(gmv.gmvMoyenneParCourseCents)}</p>
        </div>
      </div>
    </div>
  );
}

/** Graph évolution activité 7j */
export function Activite7jChart({ data }: { data: ActiviteJour[] }) {
  if (!data.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucune donnée.</p>;
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border)]" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
          <Legend />
          <Line type="monotone" dataKey="annonces" name="Annonces" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="coursesCompletees" name="Courses réalisées" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="nouveauxInscrits" name="Nouveaux inscrits" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChauffeursInactifsTable({ items }: { items: ChauffeurInactif[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucun chauffeur inactif 30j.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="pb-2 pr-4 font-medium">Nom / Email</th>
            <th className="pb-2 font-medium">Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.user_id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">
                <div>{r.full_name || "—"}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{r.email}</div>
              </td>
              <td className="py-2 text-[var(--muted-foreground)]">{r.last_activity ? new Date(r.last_activity).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Temps moyen de prise d'annonce. Objectif < 4h, > 12h = danger. */
export function TempsMoyenPriseBlock({ data, period = 30 }: { data: TempsMoyenPrise; period?: DashboardPeriod }) {
  const p = getPeriodLabel(period);
  return (
    <div className={`rounded-2xl border p-4 ${data.danger12h ? "border-red-500/50 bg-red-500/5" : data.objectif4h ? "border-emerald-500/50 bg-emerald-500/5" : "border-amber-500/50 bg-amber-500/5"}`}>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">Temps moyen de prise d&apos;annonce {p}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{data.heures.toFixed(1)} h</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Objectif : &lt; 4h
        {data.danger12h && <span className="ml-2 font-semibold text-red-600 dark:text-red-400">Réseau creux</span>}
      </p>
    </div>
  );
}

/** Chauffeurs à risque : actifs M-1 inactifs M ou baisse &gt; 50%. Action : les contacter. */
export function ChauffeursRisqueTable({ items }: { items: ChauffeurRisque[] }) {
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucun chauffeur à risque.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="pb-2 pr-4 font-medium">Nom / Email</th>
            <th className="pb-2 font-medium">Risque</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.user_id} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4">
                <div>{r.full_name || "—"}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{r.email}</div>
              </td>
              <td className="py-2">
                <span className={r.raison === "actif_m1_inactif_m" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}>
                  {r.raison === "actif_m1_inactif_m" ? "Actif M-1, inactif M" : "Baisse > 50%"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Densité par ville : identifier une ville forte à densifier */
export function DensiteVilleTable({ items, period = 30 }: { items: DensiteVille[]; period?: DashboardPeriod }) {
  const p = getPeriodLabel(period);
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]">Aucune donnée.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
            <th className="pb-2 pr-4 font-medium">Ville</th>
            <th className="pb-2 pr-4 font-medium">Chauffeurs actifs</th>
            <th className="pb-2 pr-4 font-medium">Annonces {p}</th>
            <th className="pb-2 pr-4 font-medium">Conversion</th>
            <th className="pb-2 font-medium">Temps moy. prise</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.ville} className="border-b border-[var(--border)]">
              <td className="py-2 pr-4 font-medium">{r.ville}</td>
              <td className="py-2 pr-4">{r.chauffeursActifs}</td>
              <td className="py-2 pr-4">{r.annonces7j}</td>
              <td className="py-2 pr-4">{r.tauxConversion}%</td>
              <td className="py-2">{r.tempsMoyenPriseHeures.toFixed(1)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
