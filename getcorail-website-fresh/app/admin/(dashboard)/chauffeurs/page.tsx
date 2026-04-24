import Link from "next/link";
import { getAdminChauffeurs } from "@/lib/admin-chauffeurs";
import { getChauffeursActifsM1InactifsMUserIds, getChauffeursInactifs30jUserIds } from "@/lib/admin-dashboard";
import ChauffeursTable from "./ChauffeursTable";

export default async function AdminChauffeursPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; status?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;
  const status = params.status;

  const filterUserIds =
    filter === "actifs_m1_inactifs_m"
      ? await getChauffeursActifsM1InactifsMUserIds()
      : filter === "inactifs_30j"
        ? await getChauffeursInactifs30jUserIds()
        : undefined;
  const filterVerificationStatus = status === "pending" ? "pending" : undefined;

  const rows = await getAdminChauffeurs({
    ...(filterUserIds?.length ? { filterUserIds } : {}),
    ...(filterVerificationStatus ? { filterVerificationStatus } : {}),
  });

  const activeFilter =
    filter === "actifs_m1_inactifs_m"
      ? "Actifs le mois dernier, inactifs ce mois-ci"
      : filter === "inactifs_30j"
        ? "Comptes inactifs 30j"
        : status === "pending"
          ? "Chauffeurs en attente de validation"
          : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Chauffeurs</h1>
        {activeFilter && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-[var(--foreground)]">
                Filtre : {activeFilter}
              </span>
              <Link
                href="/admin/chauffeurs"
                className="font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
              >
                Voir tous
              </Link>
            </div>
            {filter === "inactifs_30j" && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Chauffeurs n&apos;ayant eu aucune activité (course réseau ou perso) depuis 30 jours. Inclut les profils récemment créés sans aucune course.
              </p>
            )}
          </div>
        )}
      </div>
      <ChauffeursTable rows={rows} />
    </div>
  );
}
