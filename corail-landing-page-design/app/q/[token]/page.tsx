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
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  scheduled_time: string;
  price_cents: number;
  notes: string | null;
  status: string;
  created_at: string;
};

type DriverInfo = {
  full_name: string | null;
  company_name: string | null;
  professional_card_number: string | null;
  vtc_card_number: string | null;
  siren: string | null;
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
  let driverInfo: DriverInfo | null = null;
  if (q.driver_id) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name, company_name, professional_card_number, vtc_card_number, siren")
      .eq("id", q.driver_id)
      .single();
    driverInfo = user as DriverInfo | null;
  }
  const cardNumber = driverInfo?.vtc_card_number || driverInfo?.professional_card_number || null;
  const timeStr =
    typeof q.scheduled_time === "string"
      ? q.scheduled_time.slice(0, 5)
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
          <h1 className="text-xl font-semibold mb-1">Devis Corail</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Réf. {q.id}
          </p>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[var(--muted-foreground)]">Client</dt>
              <dd className="font-medium">{q.client_name}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Départ</dt>
              <dd>{q.pickup_address}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Arrivée</dt>
              <dd>{q.dropoff_address}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Date et heure</dt>
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
            <div>
              <dt className="text-[var(--muted-foreground)]">Montant</dt>
              <dd className="text-lg font-semibold text-[var(--primary)]">
                {(q.price_cents / 100).toFixed(2)} €
              </dd>
            </div>
            {q.notes && (
              <div>
                <dt className="text-[var(--muted-foreground)]">Notes</dt>
                <dd className="whitespace-pre-wrap">{q.notes}</dd>
              </div>
            )}
          </dl>

          <QuoteActions
            token={token}
            status={q.status}
            isProcessed={q.status === "ACCEPTED" || q.status === "REFUSED"}
            urlError={urlError ?? undefined}
          />

          {(driverInfo?.full_name || driverInfo?.company_name || cardNumber || driverInfo?.siren) && (
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
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
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          Ce devis est proposé par un chauffeur privé du réseau Corail. En acceptant,
          vous confirmez la réservation.
        </p>
      </div>
    </div>
  );
}
