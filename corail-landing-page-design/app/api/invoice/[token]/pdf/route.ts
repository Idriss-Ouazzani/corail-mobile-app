import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * Retourne le document de la facture (texte structuré, sections A–F).
 * Conforme aux mentions légales : émetteur, document, client, prestation, TVA, paiement.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: payload, error } = await supabase.rpc("get_invoice_public_by_token", {
      p_token: token,
    });

    if (error || payload == null) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const inv = (payload as { invoice?: Record<string, unknown> }).invoice;
    if (!inv) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const invoiceNumber = (inv.invoice_number as string) ?? "";
    const totalCents = (inv.total_amount_cents as number) ?? 0;
    const totalTTC = totalCents / 100;
    const issuedAt = inv.issued_at
      ? new Date(inv.issued_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const serviceDateStr = inv.service_date
      ? new Date(inv.service_date as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const paidAtStr = inv.paid_at
      ? new Date(inv.paid_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : null;

    const profile = (payload as { vtc_profile?: Record<string, unknown> | null }).vtc_profile ?? null;
    const driverUser = (payload as { driver_user?: { phone?: string | null; email?: string | null } | null }).driver_user ?? null;
    const driverPhone = driverUser?.phone ?? null;
    const driverEmail = driverUser?.email ?? null;

    const emitterName = (profile?.legal_business_name as string) || (profile?.display_name as string) || "";
    const emitterAddress =
      profile?.legal_address_line1 && profile?.legal_postal_code && profile?.legal_city
        ? `${profile.legal_address_line1}, ${profile.legal_postal_code} ${profile.legal_city}`
        : null;
    const isAssujettiTva = (profile?.vat_option as string) === "VAT_10";
    const totalHT = inv.total_ht_cents != null ? inv.total_ht_cents / 100 : (isAssujettiTva ? totalTTC / 1.1 : totalTTC);
    const vatAmount = inv.vat_amount_cents != null ? inv.vat_amount_cents / 100 : (isAssujettiTva ? totalTTC - totalHT : 0);
    const isB2B = !!(inv.client_company_name && inv.client_company_name.trim());

    const lines: string[] = [
      "FACTURE " + invoiceNumber,
      "",
      "════════════════════════════════════════",
      "A) ÉMETTEUR (chauffeur privé)",
      "════════════════════════════════════════",
      "Nom / Raison sociale : " + (emitterName || "—"),
      ...(emitterAddress ? ["Adresse : " + emitterAddress] : []),
      ...(profile?.siret ? ["SIRET : " + (profile.siret as string)] : []),
      ...(driverPhone ? ["Téléphone : " + driverPhone] : []),
      ...(driverEmail ? ["Email : " + driverEmail] : []),
      ...(isAssujettiTva && profile?.vat_number ? ["Numéro TVA intracommunautaire : " + (profile.vat_number as string)] : []),
      "",
      "════════════════════════════════════════",
      "B) INFORMATIONS DU DOCUMENT",
      "════════════════════════════════════════",
      "Titre : FACTURE",
      "Numéro : " + invoiceNumber,
      "Date d'émission : " + issuedAt,
      ...(serviceDateStr ? ["Date de la prestation : " + serviceDateStr] : []),
      "",
      "════════════════════════════════════════",
      "C) CLIENT",
      "════════════════════════════════════════",
      ...(isB2B
        ? [
            "Raison sociale : " + (inv.client_company_name || "—"),
            ...(inv.client_address ? ["Adresse : " + inv.client_address] : []),
            ...(inv.client_siret ? ["SIRET : " + inv.client_siret] : []),
          ]
        : ["Nom du client : " + (inv.client_name || "—")]),
      "",
      "════════════════════════════════════════",
      "D) DÉTAIL DE LA PRESTATION",
      "════════════════════════════════════════",
      "Description : Transport VTC",
      "Quantité : 1",
      "Prix unitaire TTC : " + totalTTC.toFixed(2) + " €",
      "Total : " + totalTTC.toFixed(2) + " €",
      "",
      "════════════════════════════════════════",
      "E) TVA",
      "════════════════════════════════════════",
      ...(isAssujettiTva
        ? [
            "Total HT : " + totalHT.toFixed(2) + " €",
            "TVA 10 % : " + vatAmount.toFixed(2) + " €",
            "Total TTC : " + totalTTC.toFixed(2) + " €",
          ]
        : [
            "Total : " + totalTTC.toFixed(2) + " €",
            "TVA non applicable – article 293 B du CGI",
          ]),
      "",
      "════════════════════════════════════════",
      "F) PAIEMENT",
      "════════════════════════════════════════",
      "Mode de paiement : " + (inv.payment_method || "—"),
      paidAtStr ? "Payé le : " + paidAtStr : "Date de paiement : —",
      "",
      "— Corail · getcorail.com",
    ];

    const body = lines.join("\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="facture-${invoiceNumber}.txt"`,
      },
    });
  } catch (err: unknown) {
    console.error("[invoice/pdf]", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
