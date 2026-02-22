import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * Retourne le PDF de la facture.
 * Si la table invoices n'existe pas ou la facture est absente → 404.
 * Pour l'instant retourne un fichier texte (à remplacer par un vrai PDF avec pdf-lib si besoin).
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
      .select("id, invoice_number, total_amount_cents, client_name, issued_at")
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
      client_name?: string | null;
      issued_at?: string;
    };
    const invoiceNumber = inv.invoice_number ?? "";
    const total = inv.total_amount_cents ?? 0;
    const clientName = inv.client_name ?? "Client";
    const issuedAt = inv.issued_at
      ? new Date(inv.issued_at).toLocaleDateString("fr-FR")
      : "";

    // Fichier texte lisible en attendant une génération PDF (tu peux ajouter pdf-lib plus tard)
    const body = [
      "FACTURE " + invoiceNumber,
      "",
      "Client: " + clientName,
      "Date d'émission: " + issuedAt,
      "Montant TTC: " + (total / 100).toFixed(2) + " €",
      "",
      "— Corail · getcorail.com",
    ].join("\n");

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
