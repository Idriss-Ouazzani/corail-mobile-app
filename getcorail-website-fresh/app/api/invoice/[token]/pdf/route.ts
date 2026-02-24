import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePDFDocument, type InvoicePDFData } from "./InvoicePDFDocument";

/**
 * Retourne le PDF de la facture (même mise en page que la page web : logo, sections, etc.).
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
    let inv: Record<string, unknown> | null = null;
    let profile: Record<string, unknown> | null = null;
    let driverPhone: string | null = null;
    let driverEmail: string | null = null;
    let pickupAddress: string | null = null;
    let dropoffAddress: string | null = null;
    let quoteId: string | null = null;
    let serviceTimeStr: string | null = null;
    let prestationNotes: string | null = null;
    let prestationDateStr: string | null = null;

    const { data: payload, error } = await supabase.rpc("get_invoice_public_by_token", {
      p_token: token,
    });

    if (!error && payload != null && (payload as { invoice?: unknown }).invoice) {
      const p = payload as {
        invoice: Record<string, unknown>;
        vtc_profile?: Record<string, unknown> | null;
        driver_user?: { phone?: string | null; email?: string | null } | null;
        quote_id?: string | null;
        pickup_address?: string | null;
        dropoff_address?: string | null;
      };
      inv = p.invoice;
      profile = p.vtc_profile ?? null;
      driverPhone = p.driver_user?.phone ?? null;
      driverEmail = p.driver_user?.email ?? null;
      quoteId = p.quote_id ?? null;
      pickupAddress = p.pickup_address ?? null;
      dropoffAddress = p.dropoff_address ?? null;
    } else {
      const byToken = await supabase.from("invoices").select("*").eq("public_token", token).maybeSingle();
      const res = byToken.data ?? (await supabase.from("invoices").select("*").eq("token", token).maybeSingle()).data;
      const data = Array.isArray(res) ? res[0] : res;
      if (!data) {
        return NextResponse.json(
          { error: "Facture introuvable" },
          { status: 404 }
        );
      }
      inv = data as Record<string, unknown>;
      quoteId = (inv.quote_id as string) ?? null;
      if (inv.vtc_profile_id) {
        const { data: p } = await supabase.from("vtc_profiles").select("user_id, legal_business_name, display_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number").eq("id", inv.vtc_profile_id).single();
        if (p) {
          profile = p as Record<string, unknown>;
          const userId = (p as { user_id?: string }).user_id;
          if (userId) {
            const { data: u } = await supabase.from("users").select("phone, email").eq("id", userId).single();
            if (u) {
              driverPhone = (u as { phone?: string | null }).phone ?? null;
              driverEmail = (u as { email?: string | null }).email ?? null;
            }
          }
        }
      }
      if (!profile && quoteId) {
        const { data: q } = await supabase.from("quotes").select("driver_id").eq("id", quoteId).maybeSingle();
        const did = (q as { driver_id?: string } | null)?.driver_id;
        if (did) {
          const { data: p } = await supabase.from("vtc_profiles").select("user_id, legal_business_name, display_name, legal_address_line1, legal_postal_code, legal_city, siret, vat_option, vat_number").eq("user_id", did).maybeSingle();
          if (p) {
            profile = p as Record<string, unknown>;
            const { data: u } = await supabase.from("users").select("phone, email").eq("id", did).single();
            if (u) {
              driverPhone = (u as { phone?: string | null }).phone ?? null;
              driverEmail = (u as { email?: string | null }).email ?? null;
            }
          }
        }
      }
      // Récupérer pickup/dropoff depuis la course ou la personal_ride (notes/heure dans le bloc unifié plus bas)
      const stFallback = inv.source_type as string | undefined;
      const sidFallback = inv.source_id as string | undefined;
      if (stFallback && sidFallback) {
        if (stFallback === "RIDE") {
          const { data: ride } = await supabase.from("rides").select("pickup_address, dropoff_address").eq("id", sidFallback).maybeSingle();
          if (ride) {
            pickupAddress = (ride as { pickup_address?: string }).pickup_address ?? null;
            dropoffAddress = (ride as { dropoff_address?: string }).dropoff_address ?? null;
          }
        } else if (stFallback === "PERSONAL") {
          const { data: pr } = await supabase.from("personal_rides").select("pickup_address, dropoff_address").eq("id", sidFallback).maybeSingle();
          if (pr) {
            pickupAddress = (pr as { pickup_address?: string }).pickup_address ?? null;
            dropoffAddress = (pr as { dropoff_address?: string }).dropoff_address ?? null;
          }
        }
      }
    }

    // Notes et heure de la prestation (depuis la course si dispo, pour RPC et fallback)
    const st = inv?.source_type as string | undefined;
    const sid = inv?.source_id as string | undefined;
    if (inv && st && sid) {
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
      ? new Date(inv.issued_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : "";
    const serviceDateStr = inv.service_date
      ? new Date(inv.service_date as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : prestationDateStr;
    const paidAtStr = inv.paid_at
      ? new Date(inv.paid_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
      : null;

    const emitterName = (profile?.legal_business_name as string) || (profile?.display_name as string) || null;
    const emitterAddress =
      profile?.legal_address_line1 && profile?.legal_postal_code && profile?.legal_city
        ? `${profile.legal_address_line1}, ${profile.legal_postal_code} ${profile.legal_city}`
        : null;
    const isAssujettiTva = (profile?.vat_option as string) === "VAT_10";
    const totalHT = inv.total_ht_cents != null ? inv.total_ht_cents / 100 : (isAssujettiTva ? totalTTC / 1.1 : totalTTC);
    const vatAmount = inv.vat_amount_cents != null ? inv.vat_amount_cents / 100 : (isAssujettiTva ? totalTTC - totalHT : 0);

    const clientDisplayName =
      (inv.client_company_name as string)?.trim()
        ? (inv.client_company_name as string)
        : (inv.client_name as string) ?? null;

    const pdfData: InvoicePDFData = {
      invoiceNumber,
      issuedAt,
      totalTTC,
      totalHT,
      vatAmount,
      isAssujettiTva,
      emitterName,
      emitterAddress,
      siret: (profile?.siret as string) ?? null,
      driverPhone,
      driverEmail,
      vatNumber: (profile?.vat_number as string) ?? null,
      clientName: clientDisplayName,
      clientEmail: (inv.client_email as string) ?? null,
      clientPhone: (inv.client_phone as string) ?? null,
      pickupAddress,
      dropoffAddress,
      serviceDateStr,
      serviceTimeStr,
      prestationNotes,
      paymentMethod: (inv.payment_method as string) ?? null,
      paidAtStr,
      quoteId,
    };

    const doc = React.createElement(InvoicePDFDocument, { data: pdfData });
    const buffer = await renderToBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoiceNumber}.pdf"`,
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
