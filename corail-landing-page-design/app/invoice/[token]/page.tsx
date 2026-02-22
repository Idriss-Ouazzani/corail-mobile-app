import { notFound } from "next/navigation";
import Link from "next/link";
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
  client_address?: string | null;
  client_siret?: string | null;
  service_date?: string | null;
  payment_method?: string | null;
  paid_at?: string | null;
  status: string;
  vtc_profile_id?: string | null;
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

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, public_token, invoice_number, issued_at, total_amount_cents, total_ht_cents, vat_amount_cents, client_name, client_company_name, client_address, client_siret, service_date, payment_method, paid_at, status, vtc_profile_id")
    .eq("public_token", token)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const inv = invoice as Invoice;
  let vtcLegal: VtcProfileLegal | null = null;
  let driverUser: DriverUser | null = null;

  if (inv.vtc_profile_id) {
    const { data: profile } = await supabase
      .from("vtc_profiles")
      .select("user_id, display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number")
      .eq("id", inv.vtc_profile_id)
      .single();
    if (profile) {
      vtcLegal = profile as VtcProfileLegal;
      const userId = (profile as { user_id?: string }).user_id;
      if (userId) {
        const { data: user } = await supabase
          .from("users")
          .select("full_name, email, phone")
          .eq("id", userId)
          .single();
        driverUser = user as DriverUser | null;
      }
    }
  }

  const emitterName = vtcLegal?.legal_business_name || vtcLegal?.display_name || driverUser?.full_name || null;
  const hasLegalAddress = vtcLegal?.legal_address_line1 && vtcLegal?.legal_postal_code && vtcLegal?.legal_city;
  const emitterAddress = hasLegalAddress
    ? `${vtcLegal!.legal_address_line1}, ${vtcLegal!.legal_postal_code} ${vtcLegal!.legal_city}`
    : null;
  const issuedDate = inv.issued_at
    ? new Date(inv.issued_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const serviceDateStr = inv.service_date
    ? new Date(inv.service_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const paidAtStr = inv.paid_at
    ? new Date(inv.paid_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isAssujettiTva = vtcLegal?.vat_option === "VAT_10";
  const totalCents = inv.total_amount_cents ?? 0;
  const totalTTC = totalCents / 100;
  const totalHT = inv.total_ht_cents != null ? inv.total_ht_cents / 100 : (isAssujettiTva ? totalTTC / 1.1 : totalTTC);
  const vatAmount = inv.vat_amount_cents != null ? inv.vat_amount_cents / 100 : (isAssujettiTva ? totalTTC - totalHT : 0);
  const isB2B = !!(inv.client_company_name && inv.client_company_name.trim());

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
          <h1 className="text-xl font-semibold mb-1">FACTURE</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Document légal
          </p>

          {/* A) Informations du CHAUFFEUR (émetteur) */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              A) Émetteur (chauffeur privé)
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--muted-foreground)]">Nom / Raison sociale</dt>
                <dd className="font-medium">{emitterName ?? "—"}</dd>
              </div>
              {emitterAddress && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Adresse complète</dt>
                  <dd>{emitterAddress}</dd>
                </div>
              )}
              {vtcLegal?.siret && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">SIRET</dt>
                  <dd className="font-medium tabular-nums">{vtcLegal.siret}</dd>
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
              {isAssujettiTva && vtcLegal?.vat_number && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Numéro TVA intracommunautaire</dt>
                  <dd className="font-medium tabular-nums">{vtcLegal.vat_number}</dd>
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
                <dt className="text-[var(--muted-foreground)]">Titre</dt>
                <dd className="font-medium">FACTURE</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Numéro de facture</dt>
                <dd className="font-medium">{inv.invoice_number}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Date d’émission</dt>
                <dd>{issuedDate}</dd>
              </div>
              {serviceDateStr && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Date de la prestation</dt>
                  <dd>{serviceDateStr}</dd>
                </div>
              )}
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
                    <dd className="font-medium">{inv.client_company_name}</dd>
                  </div>
                  {inv.client_address && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">Adresse</dt>
                      <dd>{inv.client_address}</dd>
                    </div>
                  )}
                  {inv.client_siret && (
                    <div>
                      <dt className="text-[var(--muted-foreground)]">SIRET</dt>
                      <dd className="tabular-nums">{inv.client_siret}</dd>
                    </div>
                  )}
                </>
              ) : (
                inv.client_name && (
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Nom du client</dt>
                    <dd className="font-medium">{inv.client_name}</dd>
                  </div>
                )
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
                <dt className="text-[var(--muted-foreground)]">Description</dt>
                <dd>Transport VTC – prestation de chauffeur privé</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Quantité</dt>
                <dd>1</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Prix unitaire TTC</dt>
                <dd>{totalTTC.toFixed(2)} €</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Total</dt>
                <dd className="font-semibold text-[var(--primary)]">{totalTTC.toFixed(2)} €</dd>
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
                  <dt className="text-[var(--muted-foreground)]">TVA 10 %</dt>
                  <dd className="font-medium">{vatAmount.toFixed(2)} €</dd>
                </div>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Total TTC</dt>
                  <dd className="font-semibold text-[var(--primary)]">{totalTTC.toFixed(2)} €</dd>
                </div>
              </dl>
            ) : (
              <>
                <div>
                  <dt className="text-[var(--muted-foreground)]">Total</dt>
                  <dd className="font-semibold text-[var(--primary)]">{totalTTC.toFixed(2)} €</dd>
                </div>
                <p className="text-sm mt-2">TVA non applicable – article 293 B du CGI</p>
              </>
            )}
          </section>

          {/* F) Paiement */}
          <section className="mb-6 pb-4 border-b border-[var(--border)]">
            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              F) Paiement
            </h2>
            <dl className="space-y-2 text-sm">
              {inv.payment_method && (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Mode de paiement</dt>
                  <dd>{inv.payment_method}</dd>
                </div>
              )}
              {paidAtStr ? (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Date de paiement</dt>
                  <dd>Payé le {paidAtStr}</dd>
                </div>
              ) : inv.payment_method ? (
                <div>
                  <dt className="text-[var(--muted-foreground)]">Date de paiement</dt>
                  <dd className="text-[var(--muted-foreground)]">—</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <a
              href={`/api/invoice/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] px-6 py-3 font-medium hover:opacity-90"
            >
              Télécharger le PDF
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          Facture émise par un chauffeur privé du réseau Corail · getcorail.com
        </p>
      </div>
    </div>
  );
}
