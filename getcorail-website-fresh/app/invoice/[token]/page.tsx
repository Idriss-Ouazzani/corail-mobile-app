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
  let inv: Invoice;
  let vtcLegal: VtcProfileLegal | null = null;
  let driverUser: DriverUser | null = null;
  let quoteId: string | null = null;
  let pickupAddress: string | null = null;
  let dropoffAddress: string | null = null;
  let serviceTimeStr: string | null = null;
  let prestationNotes: string | null = null;
  let prestationDateStr: string | null = null; // date de la prestation (facture ou course)

  const { data: payload, error: rpcError } = await supabase.rpc("get_invoice_public_by_token", {
    p_token: token,
  });

  if (!rpcError && payload != null && (payload as { invoice?: unknown }).invoice) {
    const p = payload as { invoice: Invoice; vtc_profile?: VtcProfileLegal | null; driver_user?: DriverUser | null; quote_id?: string | null; pickup_address?: string | null; dropoff_address?: string | null };
    inv = p.invoice;
    vtcLegal = p.vtc_profile ?? null;
    driverUser = p.driver_user ?? null;
    quoteId = p.quote_id ?? null;
    pickupAddress = p.pickup_address ?? null;
    dropoffAddress = p.dropoff_address ?? null;
  } else {
    if (rpcError) console.warn("[invoice page] RPC non dispo, fallback requêtes directes:", rpcError.message);
    const byToken = await supabase.from("invoices").select("*").eq("public_token", token).maybeSingle();
    const res = byToken.data ?? (await supabase.from("invoices").select("*").eq("token", token).maybeSingle()).data;
    const data = Array.isArray(res) ? res[0] : res;
    if (!data) notFound();
    inv = data as Invoice;
    if (!inv.public_token && (data as { token?: string }).token) {
      (inv as { public_token?: string }).public_token = (data as { token: string }).token;
    }
    if (inv.vtc_profile_id) {
      const { data: profile } = await supabase.from("vtc_profiles").select("user_id, display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number").eq("id", inv.vtc_profile_id).single();
      if (profile) {
        vtcLegal = profile as VtcProfileLegal;
        const userId = (profile as { user_id?: string }).user_id;
        if (userId) {
          const { data: user } = await supabase.from("users").select("full_name, email, phone").eq("id", userId).single();
          driverUser = user as DriverUser | null;
        }
      }
    }
    let driverUserId: string | null = null;
    const st = (inv as { source_type?: string | null }).source_type;
    const sid = (inv as { source_id?: string | null }).source_id;
    if (st && sid) {
      if (st === "RIDE") {
        const { data: ride } = await supabase.from("rides").select("pickup_address, dropoff_address, quote_id, picker_id, creator_id").eq("id", sid).maybeSingle();
        if (ride) {
          pickupAddress = (ride as { pickup_address?: string }).pickup_address ?? null;
          dropoffAddress = (ride as { dropoff_address?: string }).dropoff_address ?? null;
          quoteId = (ride as { quote_id?: string }).quote_id ?? null;
          driverUserId = (ride as { picker_id?: string }).picker_id ?? (ride as { creator_id?: string }).creator_id ?? null;
        }
      } else if (st === "PERSONAL") {
        const { data: pr } = await supabase.from("personal_rides").select("pickup_address, dropoff_address, quote_id, driver_id").eq("id", sid).maybeSingle();
        if (pr) {
          pickupAddress = (pr as { pickup_address?: string }).pickup_address ?? null;
          dropoffAddress = (pr as { dropoff_address?: string }).dropoff_address ?? null;
          quoteId = (pr as { quote_id?: string }).quote_id ?? null;
          driverUserId = (pr as { driver_id?: string }).driver_id ?? null;
        }
      }
    }
    if (!vtcLegal && driverUserId) {
      const { data: profile } = await supabase.from("vtc_profiles").select("id, user_id, display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number").eq("user_id", driverUserId).maybeSingle();
      if (profile) {
        vtcLegal = profile as VtcProfileLegal;
        const { data: user } = await supabase.from("users").select("full_name, email, phone").eq("id", driverUserId).single();
        driverUser = user as DriverUser | null;
      }
    }
    // Fallback chauffeur via quote_id sur la facture (comme la page devis)
    const invQuoteId = (inv as { quote_id?: string | null }).quote_id;
    if (!vtcLegal && invQuoteId) {
      const { data: q } = await supabase.from("quotes").select("driver_id").eq("id", invQuoteId).maybeSingle();
      const did = (q as { driver_id?: string } | null)?.driver_id;
      if (did) {
        const { data: profile } = await supabase.from("vtc_profiles").select("id, user_id, display_name, legal_business_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number").eq("user_id", did).maybeSingle();
        if (profile) {
          vtcLegal = profile as VtcProfileLegal;
          const { data: user } = await supabase.from("users").select("full_name, email, phone").eq("id", did).single();
          driverUser = user as DriverUser | null;
        }
      }
    }
  }

  // Notes et heure de la prestation (depuis la course si dispo)
  const st = (inv as { source_type?: string | null }).source_type;
  const sid = (inv as { source_id?: string | null }).source_id;
  if (st && sid) {
    if (st === "RIDE") {
      const { data: ride } = await supabase.from("rides").select("notes, scheduled_at").eq("id", sid).maybeSingle();
      if (ride) {
        prestationNotes = (ride as { notes?: string | null }).notes ?? null;
        const at = (ride as { scheduled_at?: string | null }).scheduled_at;
        if (at) {
          const d = new Date(at);
          serviceTimeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          prestationDateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        }
      }
    } else if (st === "PERSONAL") {
      const { data: pr } = await supabase.from("personal_rides").select("notes, scheduled_at").eq("id", sid).maybeSingle();
      if (pr) {
        prestationNotes = (pr as { notes?: string | null }).notes ?? null;
        const at = (pr as { scheduled_at?: string | null }).scheduled_at;
        if (at) {
          const d = new Date(at);
          serviceTimeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          prestationDateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        }
      }
    }
  }

  if (!inv.public_token && (inv as { token?: string }).token) {
    (inv as { public_token?: string }).public_token = (inv as { token: string }).token;
  }

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
    : prestationDateStr; // fallback date depuis la course
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
        {/* Titre + numéro et date d'émission en dessous (comme devis) */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">FACTURE</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            {inv.invoice_number}
            <span className="mx-2">·</span>
            Émise le {issuedDate}
          </p>
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
              {vtcLegal?.vat_number && (
                <p className="text-xs text-[var(--muted-foreground)] pt-1.5">
                  N° TVA Intracommunautaire : {vtcLegal.vat_number}
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
              {vtcLegal?.vat_number && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                  N° TVA Intracommunautaire : {vtcLegal.vat_number}
                </p>
              )}
            </div>
          )}
        </section>

        <div className="space-y-4">
          {/* Chauffeur — nom, adresse, SIRET, Tél / Email sur une ligne en gris */}
          <section className="text-sm">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Chauffeur
            </p>
            <div className="space-y-1 text-[var(--foreground)]">
              {emitterName && <p className="font-medium">{emitterName}</p>}
              {emitterAddressOneLine && <p>{emitterAddressOneLine}</p>}
              {vtcLegal?.siret && <p className="tabular-nums">SIRET : {vtcLegal.siret}</p>}
              {(driverUser?.phone || driverUser?.email) && (
                <p className="tabular-nums text-[var(--muted-foreground)]">
                  {driverUser?.phone && <>Tél : {driverUser.phone}</>}
                  {driverUser?.phone && driverUser?.email && " / "}
                  {driverUser?.email && <>Email : {driverUser.email}</>}
                </p>
              )}
            </div>
          </section>

          {/* Client — nom + Tél / Email sur une ligne en gris */}
          {hasClient && (
            <section className="text-sm">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">
                Client
              </p>
              <div className="space-y-0.5">
                {clientDisplayName && (
                  <p className="font-medium text-[var(--foreground)]">{clientDisplayName}</p>
                )}
                {(inv.client_phone || inv.client_email) && (
                  <p className="tabular-nums text-[var(--muted-foreground)]">
                    {inv.client_phone && <>Tél : {inv.client_phone}</>}
                    {inv.client_phone && inv.client_email && " / "}
                    {inv.client_email && <>Email : {inv.client_email}</>}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Prestation — date et heure avant Départ, puis commentaires/notes à la place de "1 course" */}
          <section className="text-sm">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Prestation
            </p>
            <div className="space-y-2 text-[var(--foreground)]">
              {(serviceDateStr || serviceTimeStr) && (
                <p className="text-[var(--muted-foreground)]">
                  {serviceDateStr}
                  {serviceDateStr && serviceTimeStr && " à "}
                  {serviceTimeStr}
                </p>
              )}
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
              {prestationNotes && prestationNotes.trim() ? (
                <p>{prestationNotes.trim()}</p>
              ) : null}
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

        {/* Pied de page : Facture + numéro, Réf. devis si présente */}
        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Facture {inv.invoice_number}
            {quoteId && (
              <>
                <span className="mx-2">·</span>
                Réf. devis : {quoteId}
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
