import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";

type Invoice = {
  id: string;
  public_token: string;
  invoice_number: string;
  issued_at: string;
  total_amount_cents: number;
  client_name: string | null;
  status: string;
  vtc_profile_id?: string | null;
};

type DriverInfo = {
  full_name: string | null;
  company_name: string | null;
  professional_card_number: string | null;
  vtc_card_number: string | null;
  siren: string | null;
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
    .select("id, public_token, invoice_number, issued_at, total_amount_cents, client_name, status, vtc_profile_id")
    .eq("public_token", token)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const inv = invoice as Invoice;
  let driverInfo: DriverInfo | null = null;
  if (inv.vtc_profile_id) {
    const { data: profile } = await supabase
      .from("vtc_profiles")
      .select("user_id")
      .eq("id", inv.vtc_profile_id)
      .single();
    const userId = (profile as { user_id?: string } | null)?.user_id;
    if (userId) {
      const { data: user } = await supabase
        .from("users")
        .select("full_name, company_name, professional_card_number, vtc_card_number, siren")
        .eq("id", userId)
        .single();
      driverInfo = user as DriverInfo | null;
    }
  }
  const cardNumber = driverInfo?.vtc_card_number || driverInfo?.professional_card_number || null;
  const issuedDate = inv.issued_at
    ? new Date(inv.issued_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

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
          <h1 className="text-xl font-semibold mb-1">Facture {inv.invoice_number}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Émise le {issuedDate}
          </p>

          <dl className="space-y-4 text-sm">
            {inv.client_name && (
              <div>
                <dt className="text-[var(--muted-foreground)]">Client</dt>
                <dd className="font-medium">{inv.client_name}</dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--muted-foreground)]">Montant TTC</dt>
              <dd className="text-lg font-semibold text-[var(--primary)]">
                {(inv.total_amount_cents / 100).toFixed(2)} €
              </dd>
            </div>
          </dl>

          {(driverInfo?.full_name || driverInfo?.company_name || cardNumber || driverInfo?.siren) && (
            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                Chauffeur privé
              </p>
              <dl className="space-y-2 text-sm">
                {(driverInfo?.full_name || driverInfo?.company_name) && (
                  <div>
                    <dt className="text-[var(--muted-foreground)]">
                      {driverInfo?.company_name ? "Raison sociale" : "Nom"}
                    </dt>
                    <dd className="font-medium">
                      {driverInfo?.company_name || driverInfo?.full_name}
                    </dd>
                  </div>
                )}
                {cardNumber && (
                  <div>
                    <dt className="text-[var(--muted-foreground)]">Numéro carte professionnelle</dt>
                    <dd className="font-medium tabular-nums">{cardNumber}</dd>
                  </div>
                )}
                {driverInfo?.siren && (
                  <div>
                    <dt className="text-[var(--muted-foreground)]">SIREN</dt>
                    <dd className="font-medium tabular-nums">{driverInfo.siren}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

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
