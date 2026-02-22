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
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount_cents, total_ht_cents, vat_amount_cents, client_name, client_company_name, client_address, client_siret, issued_at, service_date, payment_method, paid_at, vtc_profile_id")
      .eq("public_token", token)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const inv = invoice as {
      invoice_number?: string;
      total_amount_cents?: number;
      total_ht_cents?: number | null;
      vat_amount_cents?: number | null;
      client_name?: string | null;
      client_company_name?: string | null;
      client_address?: string | null;
      client_siret?: string | null;
      issued_at?: string;
      service_date?: string | null;
      payment_method?: string | null;
      paid_at?: string | null;
      vtc_profile_id?: string | null;
    };

    const invoiceNumber = inv.invoice_number ?? "";
    const totalCents = inv.total_amount_cents ?? 0;
    const totalTTC = totalCents / 100;
    const issuedAt = inv.issued_at
      ? new Date(inv.issued_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const serviceDateStr = inv.service_date
      ? new Date(inv.service_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const paidAtStr = inv.paid_at
      ? new Date(inv.paid_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : null;

    let profile: {
      legal_business_name?: string | null;
      display_name?: string | null;
      legal_address_line1?: string | null;
      legal_postal_code?: string | null;
      legal_city?: string | null;
      siret?: string | null;
      vat_option?: string | null;
      vat_number?: string | null;
    } | null = null;
    let driverPhone: string | null = null;
    let driverEmail: string | null = null;

    if (inv.vtc_profile_id) {
      const { data: p } = await supabase
        .from("vtc_profiles")
        .select("user_id, legal_business_name, display_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number")
        .eq("id", inv.vtc_profile_id)
        .single();
      profile = p as typeof profile;
      const userId = (p as { user_id?: string })?.user_id;
      if (userId) {
        const { data: u } = await supabase
          .from("users")
          .select("phone, email")
          .eq("id", userId)
          .single();
        if (u) {
          driverPhone = (u as { phone?: string | null }).phone ?? null;
          driverEmail = (u as { email?: string | null }).email ?? null;
        }
      }
    }

    const emitterName = profile?.legal_business_name || profile?.display_name || "";
    const emitterAddress =
      profile?.legal_address_line1 && profile?.legal_postal_code && profile?.legal_city
        ? `${profile.legal_address_line1}, ${profile.legal_postal_code} ${profile.legal_city}`
        : null;
    const isAssujettiTva = profile?.vat_option === "VAT_10";
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
      ...(profile?.siret ? ["SIRET : " + profile.siret] : []),
      ...(driverPhone ? ["Téléphone : " + driverPhone] : []),
      ...(driverEmail ? ["Email : " + driverEmail] : []),
      ...(isAssujettiTva && profile?.vat_number ? ["Numéro TVA intracommunautaire : " + profile.vat_number] : []),
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
      "Description : Transport VTC – prestation de chauffeur privé",
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
