/**
 * Edge Function : send-booking-accepted-email
 *
 * Envoie au client un email quand un chauffeur accepte sa demande de réservation (Page Pro).
 * Utilise Resend.io (même clé RESEND_API_KEY que send-quote-email).
 *
 * Deux modes d'appel :
 * 1) Depuis l'app (payload direct) :
 *   Body: { clientEmail, clientName?, driverName, driverPhone?, scheduledAt, pickupAddress, dropoffAddress, priceCents? }
 * 2) Depuis un Database Webhook Supabase (INSERT sur personal_rides) :
 *   Body: { type: "INSERT", table: "personal_rides", record: { ... } }
 *   → la fonction lit record (source=DIRECT_CLIENT, client_email, driver_id, etc.) et récupère le chauffeur via l'API.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// Secret à créer dans Edge Functions : SERVICE_ROLE_KEY (Supabase n'accepte pas le préfixe SUPABASE_)
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const config = { auth: false };

function formatDate(scheduledAt: string): string {
  try {
    const d = new Date(scheduledAt);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return scheduledAt;
  }
}

function formatTime(scheduledAt: string): string {
  try {
    const d = new Date(scheduledAt);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatPrice(priceCents: number | null | undefined): string {
  if (priceCents == null) return "—";
  return (priceCents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/** Téléphone affiché avec espaces tous les 2 chiffres (ex. 06 12 34 56 78) */
function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return phone;
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  return parts.join(" ");
}

/** Format court pour preheader : "15 février à 14h" */
function formatPreheader(scheduledAt: string): string {
  try {
    const d = new Date(scheduledAt);
    const day = d.getDate();
    const month = d.toLocaleDateString("fr-FR", { month: "long" });
    const hour = d.getHours();
    const min = d.getMinutes();
    const timeStr = min > 0 ? `${hour}h${String(min).padStart(2, "0")}` : `${hour}h`;
    return `Le chauffeur a confirmé votre trajet du ${day} ${month} à ${timeStr}.`;
  } catch {
    return "Le chauffeur a confirmé votre trajet.";
  }
}

/** URL Google Calendar pour "Ajouter à mon calendrier" (début + 1h, description complète) */
function buildGoogleCalendarUrl(p: {
  scheduledAt: string;
  driverName: string;
  driverPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  priceStr: string;
}): string {
  try {
    const start = new Date(p.scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatUtc = (d: Date) =>
      d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      String(d.getUTCDate()).padStart(2, "0") +
      "T" +
      String(d.getUTCHours()).padStart(2, "0") +
      String(d.getUTCMinutes()).padStart(2, "0") +
      String(d.getUTCSeconds()).padStart(2, "0") +
      "Z";
    const title = "Réservation confirmée – Chauffeur privé";
    const details = [
      `Chauffeur : ${p.driverName}`,
      `Téléphone : ${p.driverPhone || "—"}`,
      `Trajet : ${p.pickupAddress} → ${p.dropoffAddress}`,
      `Tarif : ${p.priceStr}`,
      "",
      "Réservation effectuée via la plateforme Corail.",
      "Le contrat est conclu directement avec le chauffeur.",
    ].join("\n");
    const location = p.pickupAddress;
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatUtc(start)}/${formatUtc(end)}`,
      details: details,
      location: location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return "https://calendar.google.com/calendar";
  }
}

type EmailPayload = {
  clientEmail: string;
  clientName: string;
  driverName: string;
  driverPhone: string;
  scheduledAt: string;
  pickupAddress: string;
  dropoffAddress: string;
  priceCents?: number;
  reservationId?: string;
};

type ResolveResult = { type: "payload"; payload: EmailPayload } | { type: "skipped"; reason: string } | { type: "error" };

/** Construit le payload email à partir du body (app) ou du webhook (record personal_rides). */
async function resolvePayload(body: Record<string, unknown>): Promise<ResolveResult> {
  // Format Database Webhook Supabase (INSERT personal_rides)
  if (body.type === "INSERT" && body.table === "personal_rides" && body.record && typeof body.record === "object") {
    const record = body.record as Record<string, unknown>;
    if (record.source !== "DIRECT_CLIENT") {
      console.log("[send-booking-accepted-email] Webhook ignoré: source !== DIRECT_CLIENT");
      return { type: "skipped", reason: "source !== DIRECT_CLIENT" };
    }
    const clientEmail = (record.client_email as string)?.trim();
    if (!clientEmail) {
      console.log("[send-booking-accepted-email] Webhook ignoré: pas de client_email");
      return { type: "skipped", reason: "no client_email" };
    }
    const driverId = record.driver_id as string;
    if (!driverId || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("[send-booking-accepted-email] Webhook: SUPABASE_URL ou SERVICE_ROLE_KEY manquant");
      return { type: "error" };
    }
    const driverRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(driverId)}&select=full_name,phone`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );
    const driverRows = await driverRes.json();
    const driver = Array.isArray(driverRows) ? driverRows[0] : null;
    const driverName = (driver?.full_name as string) || "Votre chauffeur";
    const driverPhone = (driver?.phone as string) || "";

    return {
      type: "payload",
      payload: {
        clientEmail,
        clientName: ((record.client_name as string)?.trim()) || "Client",
        driverName,
        driverPhone,
        scheduledAt: String(record.scheduled_at ?? ""),
        pickupAddress: String(record.pickup_address ?? ""),
        dropoffAddress: String(record.dropoff_address ?? ""),
        priceCents: typeof record.price_cents === "number" ? record.price_cents : undefined,
        reservationId: typeof record.id === "string" ? record.id : undefined,
      },
    };
  }

  // Format app (payload direct)
  const clientEmail = (body.clientEmail as string)?.trim();
  const clientName = ((body.clientName as string)?.trim()) || "Client";
  const driverName = (body.driverName as string)?.trim() || "Votre chauffeur";
  const driverPhone = (body.driverPhone as string) ?? "";
  const scheduledAt = String(body.scheduledAt ?? "");
  const pickupAddress = String(body.pickupAddress ?? "");
  const dropoffAddress = String(body.dropoffAddress ?? "");
  const priceCents = typeof body.priceCents === "number" ? body.priceCents : undefined;
  const reservationId = typeof body.reservationId === "string" ? body.reservationId : undefined;

  if (!clientEmail || !driverName || !scheduledAt || !pickupAddress || !dropoffAddress) {
    return { type: "error" };
  }
  return {
    type: "payload",
    payload: { clientEmail, clientName, driverName, driverPhone, scheduledAt, pickupAddress, dropoffAddress, priceCents, reservationId },
  };
}

serve(async (req) => {
  console.log("[send-booking-accepted-email] Invocation reçue, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY non configuré");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const result = await resolvePayload(body);

    if (result.type === "skipped") {
      return new Response(
        JSON.stringify({ skipped: true, reason: result.reason }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (result.type === "error") {
      console.error("[send-booking-accepted-email] Champs requis manquants ou config manquante");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = result.payload;
    const { clientEmail, clientName, driverName, driverPhone, scheduledAt, pickupAddress, dropoffAddress, priceCents, reservationId } = payload;

    const dateStr = formatDate(scheduledAt);
    const timeStr = formatTime(scheduledAt);
    const priceStr = formatPrice(priceCents);
    const driverPhoneDisplay = driverPhone ? formatPhoneDisplay(driverPhone) : "";
    const preheaderText = formatPreheader(scheduledAt);
    const calendarUrl = buildGoogleCalendarUrl({
      scheduledAt,
      driverName,
      driverPhone,
      pickupAddress,
      dropoffAddress,
      priceStr,
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre chauffeur privé est confirmé</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #161a22;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #161a22; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #1e232b; border-radius: 16px; overflow: hidden; max-width: 100%; border: 1px solid #2d3544;">
          <tr>
            <td style="background-color: #d97a4a; padding: 0; height: 4px; line-height: 0; font-size: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 24px 28px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0; color: #f8f9fa; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
                      Votre chauffeur privé est confirmé
                    </p>
                    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">
                      ${preheaderText}
                    </p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <a href="https://getcorail.com" target="_blank" rel="noopener noreferrer" style="display: inline-block;">
                      <img src="https://getcorail.com/images/corail-logo.png" alt="Corail" width="176" height="88" style="display: block; height: 88px; width: auto; max-width: 176px;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 28px 28px;">
              <p style="margin: 0 0 12px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Bonjour ${clientName},
              </p>
              <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                Votre réservation a bien été acceptée par le chauffeur. Voici les informations pour votre course :
              </p>

              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;">
                Détails de la course
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border: 1px solid #2d3544; border-radius: 10px; background-color: #161a22;">
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Référence de réservation</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 13px; font-family: monospace;">${reservationId || "—"}</td></tr>
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Chauffeur</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 14px;">${driverName}</td></tr>
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Téléphone</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; font-size: 14px;">${driverPhone ? `<a href="tel:${driverPhone}" style="color: #d97a4a; text-decoration: none;">${driverPhoneDisplay}</a>` : "—"}</td></tr>
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Date</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 14px;">${dateStr}</td></tr>
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Heure</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 14px;">${timeStr}</td></tr>
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Trajet</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 14px;">${pickupAddress} → ${dropoffAddress}</td></tr>
                <tr><td style="padding: 14px 18px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Tarif TTC</td><td style="padding: 14px 18px; color: #d97a4a; font-size: 15px; font-weight: 600;">${priceStr}</td></tr>
              </table>

              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                Paiement à régler directement auprès du chauffeur.
              </p>
              <p style="margin: 0 0 20px 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                Le service est assuré par un chauffeur indépendant. Corail agit comme plateforme de mise en relation.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="${calendarUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 24px; background-color: #d97a4a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                      Ajouter à mon calendrier
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; padding-top: 20px; border-top: 1px solid #2d3544; color: #64748b; font-size: 12px;">
                L'équipe Corail — Plateforme de mise en relation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "GetCorail <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject: "Votre chauffeur privé est confirmé",
        html: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur Resend:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: data }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Email réservation acceptée envoyé à:", clientEmail);
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erreur send-booking-accepted-email:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
