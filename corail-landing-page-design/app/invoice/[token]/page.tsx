import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseServer } from "@/lib/supabase-server";

type Invoice = {
  id: string;
  public_token: string;
  invoice_number: string;
  issued_at: string;
  total_amount_cents: number;
  total_ht_cents?: number | null;
  vat_amount_cents?: number | null;
  client_name: string | null;
  client_company_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  service_date?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  status: string;
  vtc_profile_id?: string | null;
  source_type?: string | null;
  source_id?: string | null;
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
};

type DriverUser = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabaseServer();

  // Essayer public_token puis token (au cas où la colonne s’appelle comme pour les devis)
  const { data: payload, error: rpcError } = await supabase.rpc("get_invoice_public_by_token", {
    p_token: token,
  });

  if (rpcError || payload == null) {
    if (rpcError) console.error("[invoice page] RPC error:", rpcError.message);
    notFound();
  }

  const inv = (payload as { invoice?: Invoice }).invoice as Invoice;
  if (!inv) notFound();
  if (!inv.public_token && (inv as { token?: string }).token) {
    (inv as { public_token?: string }).public_token = (inv as { token: string }).token;
  }

  const vtcLegal: VtcProfileLegal | null = (payload as { vtc_profile?: VtcProfileLegal | null }).vtc_profile ?? null;
  const driverUser: DriverUser | null = (payload as { driver_user?: DriverUser | null }).driver_user ?? null;
  const quoteId: string | null = (payload as { quote_id?: string | null }).quote_id ?? null;
  const pickupAddress: string | null = (payload as { pickup_address?: string | null }).pickup_address ?? null;
  const dropoffAddress: string | null = (payload as { dropoff_address?: string | null }).dropoff_address ?? null;

  const emitterName = vtcLegal?.legal_business_name || vtcLegal?.display_name || driverUser?.full_name || null;
  const hasLegalAddress = vtcLegal?.legal_address_line1 && vtcLegal?.legal_postal_code && vtcLegal?.legal_city;
  const emitterAddressOneLine = hasLegalAddress
    ? `${vtcLegal!.legal_address_line1}, ${vtcLegal!.legal_postal_code} ${vtcLegal!.legal_city}`.replace(/\s+/g, " ").trim()
    : null;
  const issuedDate = inv.issued_at
    ? new Date(inv.issued_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const serviceDateStr = inv.service_date
    ? new Date(inv.service_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const paidAtStr = inv.paid_at
    ? new Date(inv.paid_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const isAssujettiTva = vtcLegal?.vat_option === "VAT_10";
  const totalCents = inv.total_amount_cents ?? 0;
  const totalTTC = totalCents / 100;
  const totalHT = inv.total_ht_cents != null ? inv.total_ht_cents / 100 : (isAssujettiTva ? totalTTC / 1.1 : totalTTC);
  const vatAmount = inv.vat_amount_cents != null ? inv.vat_amount_cents / 100 : (isAssujettiTva ? totalTTC - totalHT : 0);
  const clientDisplayName = (inv.client_company_name && inv.client_company_name.trim()) ? inv.client_company_name : inv.client_name;

  const hasClient = clientDisplayName || inv.client_email || inv.client_phone;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center justify-between px-4 pt-4 pb-2 md:px-6 md:pt-6">
        <Link
          href="https://getcorail.com"
          className="text-xs text-[var(--muted-foreground)] hover:underline"
        >
          ← getcorail.com
        </Link>
        <Link href="https://getcorail.com" className="shrink-0">
          <Image
            src="/images/corail-logo.png"
            alt="Corail"
            width={384}
            height={128}
            className="h-32 w-auto object-contain opacity-90"
          />
        </Link>
      </header>

      <main className="px-4 pb-8 md:px-6 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">FACTURE</h1>
        </div>

        {/* Montant (prioritaire) */}
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
            </div>
          ) : (
            <div>
              <p className="text-2xl font-semibold tabular-nums text-[var(--primary)]">
                {totalTTC.toFixed(2)} €
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                TVA non applicable (art. 293 B du CGI)
              </p>
            </div>
          )}
        </section>

        <div className="space-y-4">
          {/* Chauffeur — valeurs uniquement (nom, adresse, SIRET, tél, email, N° TVA si assujetti) */}
          <section className="text-sm">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Chauffeur
            </p>
            <div className="space-y-1 text-[var(--foreground)]">
              {emitterName && <p className="font-medium">{emitterName}</p>}
              {emitterAddressOneLine && <p>{emitterAddressOneLine}</p>}
              {vtcLegal?.siret && <p className="tabular-nums">{vtcLegal.siret}</p>}
              {driverUser?.phone && <p className="tabular-nums">{driverUser.phone}</p>}
              {driverUser?.email && <p>{driverUser.email}</p>}
              {isAssujettiTva && vtcLegal?.vat_number && (
                <p className="tabular-nums">{vtcLegal.vat_number}</p>
              )}
            </div>
          </section>

          {/* Client — nom + optionnel email, optionnel téléphone */}
          {hasClient && (
            <section className="text-xs text-[var(--muted-foreground)]">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Client
              </p>
              <div className="space-y-0.5">
                {clientDisplayName && (
                  <p className="font-medium text-[var(--foreground)]">{clientDisplayName}</p>
                )}
                {inv.client_email && <p>{inv.client_email}</p>}
                {inv.client_phone && <p className="tabular-nums">{inv.client_phone}</p>}
              </div>
            </section>
          )}

          {/* Prestation — itinéraire comme le devis + date, paiement */}
          <section className="text-sm">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Prestation
            </p>
            <div className="space-y-2 text-[var(--foreground)]">
              {(pickupAddress || dropoffAddress) && (
                <>
                  {pickupAddress && (
                    <p><span className="text-[var(--muted-foreground)]">Départ</span><br />{pickupAddress}</p>
                  )}
                  {dropoffAddress && (
                    <p><span className="text-[var(--muted-foreground)]">Arrivée</span><br />{dropoffAddress}</p>
                  )}
                </>
              )}
              <p>1 course</p>
              {serviceDateStr && <p>Date : {serviceDateStr}</p>}
              {inv.payment_method && <p>Paiement : {inv.payment_method}</p>}
              {paidAtStr && <p>Payé le {paidAtStr}</p>}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <a
            href={`/api/invoice/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-2.5 px-3 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            Télécharger le PDF
          </a>
        </div>

        {/* Mini-bloc infos facture (typo petite, discret) */}
        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Facture {inv.invoice_number}
            <span className="mx-2">·</span>
            Émise le {issuedDate}
          </p>
          {quoteId && (
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
              Réf. devis : {quoteId}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
