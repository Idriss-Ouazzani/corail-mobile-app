import Link from "next/link";
import { listCredentialChangeRequests } from "@/lib/credential-change-requests";
import { toAdminAssetUrlFromStored } from "@/lib/admin-verification-asset";
import { listPendingDriverVerificationsForAdmin } from "@/lib/pending-driver-verifications";
import { getSupabaseServer } from "@/lib/supabase-server";
import DemandesEnCoursPremium from "./DemandesEnCoursPremium";

export const dynamic = "force-dynamic";

export default async function AdminCertifDemandsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const p = await searchParams;
  const filtre = p.filtre === "tout" ? "all" : "pending";

  const [credentialRows, pendingVerifs] = await Promise.all([
    listCredentialChangeRequests({
      status: filtre === "all" ? "all" : "pending",
    }),
    listPendingDriverVerificationsForAdmin().catch((err) => {
      console.error("listPendingDriverVerificationsForAdmin:", err);
      return [] as Awaited<ReturnType<typeof listPendingDriverVerificationsForAdmin>>;
    }),
  ]);

  const BUCKET = "driver-verification";

  const docUrlMap: Record<string, string> = {};
  const docUrlMapVerso: Record<string, string> = {};
  for (const r of credentialRows) {
    if (r.document_path) {
      const view = toAdminAssetUrlFromStored(r.document_path, BUCKET);
      if (view) docUrlMap[r.id] = view;
    }
    if (r.document_path_verso) {
      const v = toAdminAssetUrlFromStored(r.document_path_verso, BUCKET);
      if (v) docUrlMapVerso[r.id] = v;
    }
  }

  const userIdsCred = [...new Set(credentialRows.map((r) => r.user_id))];
  const verificationPreviewByUserId: Record<
    string,
    { vtcR: string | null; vtcV: string | null; ins: string | null }
  > = {};
  if (userIdsCred.length) {
    const supabase = getSupabaseServer();
    const { data: vps } = await supabase
      .from("vtc_profiles")
      .select(
        "user_id, verification_vtc_card_url, verification_vtc_card_url_verso, verification_insurance_url, legal_kbis_url"
      )
      .in("user_id", userIdsCred);
    for (const vp of vps || []) {
      const uid = String(vp.user_id);
      verificationPreviewByUserId[uid] = {
        vtcR: toAdminAssetUrlFromStored(vp.verification_vtc_card_url, BUCKET),
        vtcV: toAdminAssetUrlFromStored(vp.verification_vtc_card_url_verso, BUCKET),
        ins: toAdminAssetUrlFromStored(vp.verification_insurance_url, BUCKET),
        kbis: toAdminAssetUrlFromStored((vp as { legal_kbis_url?: string | null }).legal_kbis_url, BUCKET),
      };
    }
  }
  const driverRows = pendingVerifs.map((r) => ({
    ...r,
    _signedVtc: toAdminAssetUrlFromStored(r.verification_vtc_card_url, BUCKET),
    _signedVtcVerso: toAdminAssetUrlFromStored(r.verification_vtc_card_url_verso, BUCKET),
    _signedId: toAdminAssetUrlFromStored(r.verification_id_card_url, BUCKET),
    _signedIdVerso: toAdminAssetUrlFromStored(r.verification_id_card_url_verso, BUCKET),
    _signedInsurance: toAdminAssetUrlFromStored(r.verification_insurance_url, BUCKET),
  }));

  return (
    <div className="pb-12">
      <header className="mb-10 border-b border-[var(--border)]/80 pb-8">
        <p className="font-[family-name:var(--font-serif)] text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          File d’attente
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Demandes en cours
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          Vérification des documents (nouveaux profils) et changements certifiés pour les comptes déjà vérifiés.
          Tu peux aussi traiter ces demandes depuis l’app admin.
        </p>
      </header>

      <DemandesEnCoursPremium
        driverRows={driverRows}
        credentialRows={credentialRows}
        docUrlMap={docUrlMap}
        docUrlMapVerso={docUrlMapVerso}
        verificationPreviewByUserId={verificationPreviewByUserId}
        credentialFiltre={filtre}
      />

      <p className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/admin" className="rounded-lg px-2 py-1 text-[var(--primary)] transition hover:bg-[var(--muted)]/30 hover:underline">
          ← Tableau de bord
        </Link>
      </p>
    </div>
  );
}
