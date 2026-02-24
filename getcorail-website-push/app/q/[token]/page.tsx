import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  vat_number: string | null;
  vehicle_seats: number | null;
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
      .select("display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number, vehicle_seats")
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
        month: "short",
        year: "numeric",
      })
    : "";
  const validUntilDate = q.valid_until
    ? new Date(q.valid_until).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : (() => {
        const d = new Date(q.created_at || Date.now());
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
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
  const emitterAddressOneLine =
    profile?.legal_address_line1 && profile?.legal_postal_code && profile?.legal_city
      ? `${profile.legal_address_line1}, ${profile.legal_postal_code} ${profile.legal_city}`.replace(/\s+/g, " ").trim()
      : null;
  const clientDisplayName =
    (q.client_company_name && q.client_company_name.trim())
      ? q.client_company_name
      : q.client_name;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header: back link + logo (logo moitié taille, bien à droite / angle) */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <Link
          href="https://getcorail.com"
          className="text-xs text-[var(--muted-foreground)] hover:underline shrink-0"
        >
          ← getcorail.com
        </Link>
        <Link href="https://getcorail.com" className="shrink-0 ml-auto -mr-2 md:-mr-4 pr-0">
          <Image
            src="/images/corail-logo.png"
            alt="Corail"
            width={192}
            height={64}
            className="h-16 w-auto object-contain object-right opacity-90"
          />
        </Link>
      </header>

      <main className="px-4 pb-8 md:px-6 max-w-md mx-auto">
        {/* Titre + numéro et date en discret */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">DEVIS</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {q.id}
            <span className="mx-2">·</span>
            Émis le {emissionDate}
          </p>
        </div>

        {/* Statut (badge compact si déjà traité) */}
        {(q.status === "ACCEPTED" || q.status === "REFUSED") && (
          <div className="mb-3">
            <span
              className={
                q.status === "ACCEPTED"
                  ? "inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "inline-flex items-center rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
              }
            >
              {q.status === "ACCEPTED" ? "Accepté" : "Refusé"}
            </span>
          </div>
        )}

        {/* Bloc Prix en premier : visible sans scroll sur mobile */}
        <section className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-4 mb-5">
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
            Montant
          </p>
          {isAssujettiTva ? (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Total HT</span>
                <span className="tabular-nums">{totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">TVA (10 %)</span>
                <span className="tabular-nums">{vatAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                <span className="font-semibold">Total TTC</span>
                <span className="text-lg font-semibold tabular-nums text-[var(--primary)]">
                  {totalTTC.toFixed(2)} €
                </span>
              </div>
              {isAssujettiTva && profile?.vat_number && (
                <p className="text-xs text-[var(--muted-foreground)] pt-1.5">
                  N° TVA Intracommunautaire : {profile.vat_number}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-2xl font-semibold tabular-nums text-[var(--primary)]">
                {totalTTC.toFixed(2)} €
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                TVA non applicable (art. 293 B du CGI)
              </p>
              {profile?.vat_number && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                  N° TVA Intracommunautaire : {profile.vat_number}
                </p>
              )}
            </div>
          )}
        </section>

        <div className="space-y-5">
          {/* Chauffeur : raison sociale, adresse, SIRET, Tél (pas d’email) */}
          <section className="text-sm">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Chauffeur
            </p>
            <div className="space-y-1 text-[var(--foreground)]">
              {emitterName && <p className="font-medium">{emitterName}</p>}
              {emitterAddressOneLine && <p>{emitterAddressOneLine}</p>}
              {profile?.siret && <p className="tabular-nums">SIRET : {profile.siret}</p>}
              {driverUser?.phone && (
                <p className="tabular-nums text-[var(--muted-foreground)]">Tél : {driverUser.phone}</p>
              )}
            </div>
          </section>

          {/* Bloc 2 — Client */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Client
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium">{clientDisplayName}</p>
              {q.client_phone && (
                <p className="tabular-nums text-[var(--muted-foreground)]">
                  Tél : {q.client_phone}
                </p>
              )}
              {q.client_email && (
                <p className="text-[var(--muted-foreground)]">
                  Email : {q.client_email}
                </p>
              )}
            </div>
          </section>

          {/* Bloc 3 — Prestation : date au-dessus de Départ, puis commentaires si présents */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Prestation
            </p>
            <div className="space-y-2 text-sm">
              <p>
                {new Date(q.scheduled_date).toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                à {timeStr}
              </p>
              <p className="leading-snug">
                <span className="text-[var(--muted-foreground)]">Départ</span><br />
                {q.pickup_address}
              </p>
              <p className="leading-snug">
                <span className="text-[var(--muted-foreground)]">Arrivée</span><br />
                {q.dropoff_address}
              </p>
              {q.notes && q.notes.trim() && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {q.notes.trim()}
                </p>
              )}
            </div>
          </section>

        </div>

        {/* Actions (Accepter / Refuser) */}
        <div className="mt-6">
          <QuoteActions
            token={token}
            status={q.status}
            isProcessed={q.status === "ACCEPTED" || q.status === "REFUSED"}
            urlError={urlError ?? undefined}
          />
        </div>

        {/* Micro-bloc infos devis (discret) */}
        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Valable jusqu’au {validUntilDate}
          </p>
        </div>
      </main>
    </div>
  );
}
