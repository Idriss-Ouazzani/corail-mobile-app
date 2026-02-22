import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { QuoteActions } from "./quote-actions";

type Quote = {
  id: string;
  token: string;
  driver_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_company_name: string | null;
  client_address: string | null;
  client_siret: string | null;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  scheduled_time: string;
  price_cents: number;
  notes: string | null;
  status: string;
  created_at: string;
  valid_until: string | null;
};

type VtcProfileLegal = {
  display_name: string | null;
  legal_business_name: string | null;
  legal_address_line1: string | null;
  legal_postal_code: string | null;
  legal_city: string | null;
  siret: string | null;
  vat_option: string | null;
};

type DriverUser = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export const dynamic = "force-dynamic";

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const urlError = typeof sp?.error === "string" ? sp.error : null;
  const supabase = getSupabaseServer();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !quote) {
    notFound();
  }

  const q = quote as Quote;

  let profile: VtcProfileLegal | null = null;
  let driverUser: DriverUser | null = null;

  if (q.driver_id) {
    const { data: vtcRow } = await supabase
      .from("vtc_profiles")
      .select("display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option")
      .eq("user_id", q.driver_id)
      .single();
    profile = vtcRow as VtcProfileLegal | null;

    const { data: userRow } = await supabase
      .from("users")
      .select("full_name, email, phone")
      .eq("id", q.driver_id)
      .single();
    driverUser = userRow as DriverUser | null;
  }

  const timeStr =
    typeof q.scheduled_time === "string"
      ? q.scheduled_time.slice(0, 5)
      : "";
  const emissionDate = q.created_at
    ? new Date(q.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const validUntilDate = q.valid_until
    ? new Date(q.valid_until).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : (() => {
        const d = new Date(q.created_at || Date.now());
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      })();

  const isAssujettiTva = profile?.vat_option === "VAT_10";
  const totalCents = q.price_cents;
  const totalTTC = totalCents / 100;
  const totalHT = isAssujettiTva ? totalTTC / 1.1 : totalTTC;
  const vatAmount = isAssujettiTva ? totalTTC - totalHT : 0;

  const emitterName =
    profile?.legal_business_name || profile?.display_name || driverUser?.full_name || "";
  const emitterAddress =
    profile?.legal_address_line1 && profile?.legal_postal_code && profile?.legal_city
      ? `${profile.legal_address_line1}, ${profile.legal_postal_code} ${profile.legal_city}`
      : null;
  const isB2B = !!(q.client_company_name && q.client_company_name.trim());

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link
            href="https://getcorail.com"
            className="text-sm text-[var(--muted-foreground)] hover:underline"
          >
            ← Retour à getcorail.com
          </Link>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-1">DEVIS – Transport VTC</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Document à caractère professionnel
          </p>

          {/* A) Informations du CHAUFFEUR (émetteur) */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              A) Émetteur du devis (chauffeur)
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Nom ou raison sociale</dt>
                <dd className="font-medium">{emitterName || "—"}</dd>
              </div>
              {emitterAddress && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Adresse complète</dt>
                  <dd>{emitterAddress}</dd>
                </div>
              )}
              {profile?.siret && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">SIRET (14 chiffres)</dt>
                  <dd className="font-medium tabular-nums">{profile.siret}</dd>
                </div>
              )}
              {driverUser?.phone && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Téléphone</dt>
                  <dd className="tabular-nums">{driverUser.phone}</dd>
                </div>
              )}
              {driverUser?.email && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Email</dt>
                  <dd>{driverUser.email}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* B) Informations du DOCUMENT */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              B) Informations du document
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Numéro de devis</dt>
                <dd className="font-medium">{q.id}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Date d’émission</dt>
                <dd>{emissionDate}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Date de validité</dt>
                <dd>Valable jusqu’au {validUntilDate}</dd>
              </div>
            </dl>
          </section>

          {/* C) Informations du CLIENT */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              C) Client
            </h2>
            <dl className="space-y-2 text-sm">
              {isB2B ? (
                <>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Raison sociale</dt>
                    <dd className="font-medium">{q.client_company_name}</dd>
                  </div>
                  {q.client_address && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Adresse</dt>
                      <dd>{q.client_address}</dd>
                    </div>
                  )}
                  {q.client_siret && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">SIRET</dt>
                      <dd className="tabular-nums">{q.client_siret}</dd>
                    </div>
                  )}
                  {q.client_email && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Email</dt>
                      <dd>{q.client_email}</dd>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Nom du client</dt>
                    <dd className="font-medium">{q.client_name}</dd>
                  </div>
                  {q.client_email && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Email (optionnel)</dt>
                      <dd>{q.client_email}</dd>
                    </div>
                  )}
                  {q.client_phone && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Téléphone (optionnel)</dt>
                      <dd className="tabular-nums">{q.client_phone}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </section>

          {/* D) Détail de la prestation */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              D) Détail de la prestation
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Description du trajet</dt>
                <dd>
                  Départ : {q.pickup_address} — Arrivée : {q.dropoff_address}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Date de la course</dt>
                <dd>
                  {new Date(q.scheduled_date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  à {timeStr}
                </dd>
              </div>
              {q.notes && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Distance / précisions</dt>
                  <dd className="whitespace-pre-wrap">{q.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-[var(--muted-foreground)]">Montant total proposé</dt>
                <dd className="text-lg font-semibold text-[var(--primary)]">
                  {totalTTC.toFixed(2)} €
                </dd>
              </div>
            </dl>
          </section>

          {/* E) TVA */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              E) TVA
            </h2>
            {isAssujettiTva ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[var(--muted-foreground)]">Total HT</dt>
                  <dd className="font-medium">{totalHT.toFixed(2)} €</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">TVA (10 %)</dt>
                  <dd className="font-medium">{vatAmount.toFixed(2)} €</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Total TTC</dt>
                  <dd className="font-semibold text-[var(--primary)]">{totalTTC.toFixed(2)} €</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm">
                TVA non applicable – article 293 B du CGI
              </p>
            )}
          </section>

          <QuoteActions
            token={token}
            status={q.status}
            isProcessed={q.status === "ACCEPTED" || q.status === "REFUSED"}
            urlError={urlError ?? undefined}
          />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          Ce devis est proposé par un chauffeur privé du réseau Corail. En acceptant,
          vous confirmez la réservation.
        </p>
      </div>
    </div>
  );
}
