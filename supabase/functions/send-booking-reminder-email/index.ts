/**
 * Edge Function : send-booking-reminder-email
 *
 * Envoie au client un email de rappel 24h avant la course (même style que la confirmation).
 * Utilise Resend.io (RESEND_API_KEY, RESEND_FROM_EMAIL).
 *
 * Deux modes d'appel :
 * 1) Payload direct (test ou appel manuel) :
 *    Body: { clientEmail, clientName?, driverName, driverPhone?, scheduledAt, pickupAddress, dropoffAddress, priceCents?, reservationId? }
 * 2) Mode cron : Body: { "cron": true } avec header Authorization: Bearer <CRON_SECRET>
 *    → récupère les personal_rides dont la course est dans ~24h, client_email renseigné,
 *      source = DIRECT_CLIENT, reminder_24h_sent_at IS NULL, envoie l'email puis met à jour reminder_24h_sent_at.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  return (
    (priceCents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return phone;
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  return parts.join(" ");
}

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
    const title = "Réservation – Chauffeur privé";
    const details = [
      `Chauffeur : ${p.driverName}`,
      `Téléphone : ${p.driverPhone || "—"}`,
      `Trajet : ${p.pickupAddress} → ${p.dropoffAddress}`,
      `Tarif : ${p.priceStr}`,
      "",
      "Réservation effectuée via la plateforme Corail.",
    ].join("\n");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatUtc(start)}/${formatUtc(end)}`,
      details: details,
      location: p.pickupAddress,
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

function buildReminderHtml(payload: EmailPayload): string {
  const {
    clientEmail,
    clientName,
    driverName,
    driverPhone,
    scheduledAt,
    pickupAddress,
    dropoffAddress,
    priceCents,
    reservationId,
  } = payload;
  const dateStr = formatDate(scheduledAt);
  const timeStr = formatTime(scheduledAt);
  const priceStr = formatPrice(priceCents);
  const driverPhoneDisplay = driverPhone ? formatPhoneDisplay(driverPhone) : "";
  const calendarUrl = buildGoogleCalendarUrl({
    scheduledAt,
    driverName,
    driverPhone,
    pickupAddress,
    dropoffAddress,
    priceStr,
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel : votre course demain</title>
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
                      Rappel : votre course demain
                    </p>
                    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">
                      Votre chauffeur privé vous attend — ${dateStr} à ${timeStr}
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
                Votre course est prévue dans 24 heures. Voici un rappel des informations :
              </p>

              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;">
                Détails de la course
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border: 1px solid #2d3544; border-radius: 10px; background-color: #161a22;">
                <tr><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;">Référence</td><td style="padding: 14px 18px; border-bottom: 1px solid #2d3544; color: #f8f9fa; font-size: 13px; font-family: monospace;">${reservationId || "—"}</td></tr>
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
}

async function sendOneReminder(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not configured" };
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "GetCorail <onboarding@resend.dev>";
  const htmlContent = buildReminderHtml(payload);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.clientEmail],
      subject: "Rappel : votre course demain",
      html: htmlContent,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("❌ Resend reminder error:", data);
    return { ok: false, error: JSON.stringify(data) };
  }
  return { ok: true };
}

/** Récupère les courses dans la fenêtre ~24h et dont le rappel n'a pas encore été envoyé. */
async function fetchRidesDueForReminder(): Promise<EmailPayload[]> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return [];
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/personal_rides?scheduled_at=gte.${from}&scheduled_at=lte.${to}&source=eq.DIRECT_CLIENT&status=eq.SCHEDULED&reminder_24h_sent_at=is.null&client_email=not.is.null&select=id,client_email,client_name,driver_id,pickup_address,dropoff_address,scheduled_at,price_cents`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const payloads: EmailPayload[] = [];
  for (const row of rows) {
    const clientEmail = (row.client_email as string)?.trim();
    if (!clientEmail) continue;
    const driverId = row.driver_id;
    let driverName = "Votre chauffeur";
    let driverPhone = "";
    if (driverId) {
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
      if (driver) {
        driverName = (driver.full_name as string) || driverName;
        driverPhone = (driver.phone as string) || "";
      }
    }
    payloads.push({
      clientEmail,
      clientName: (row.client_name as string)?.trim() || "Client",
      driverName,
      driverPhone,
      scheduledAt: String(row.scheduled_at ?? ""),
      pickupAddress: String(row.pickup_address ?? ""),
      dropoffAddress: String(row.dropoff_address ?? ""),
      priceCents: typeof row.price_cents === "number" ? row.price_cents : undefined,
      reservationId: row.id,
    });
  }
  return payloads;
}

/** Marque le rappel comme envoyé pour un personal_ride. */
async function markReminderSent(personalRideId: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return;
  await fetch(`${SUPABASE_URL}/rest/v1/personal_rides?id=eq.${encodeURIComponent(personalRideId)}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ reminder_24h_sent_at: new Date().toISOString() }),
  });
}

serve(async (req) => {
  console.log("[send-booking-reminder-email] Invocation, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Mode cron : récupérer les courses éligibles et envoyer
    if (body.cron === true) {
      if (!CRON_SECRET) {
        console.error("CRON_SECRET non configuré");
        return new Response(
          JSON.stringify({ error: "Cron not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const auth = req.headers.get("Authorization") || "";
      if (auth !== `Bearer ${CRON_SECRET}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const payloads = await fetchRidesDueForReminder();
      const results: { id: string; sent: boolean; error?: string }[] = [];
      for (const p of payloads) {
        const res = await sendOneReminder(p);
        const rid = p.reservationId || "";
        if (res.ok && rid) await markReminderSent(rid);
        results.push({ id: rid, sent: res.ok, error: res.error });
      }
      console.log("[send-booking-reminder-email] Cron: sent", results.filter((r) => r.sent).length, "reminders");
      return new Response(
        JSON.stringify({ success: true, count: payloads.length, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payload direct (un seul rappel)
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
      return new Response(
        JSON.stringify({ error: "Missing required fields: clientEmail, driverName, scheduledAt, pickupAddress, dropoffAddress" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: EmailPayload = {
      clientEmail,
      clientName,
      driverName,
      driverPhone,
      scheduledAt,
      pickupAddress,
      dropoffAddress,
      priceCents,
      reservationId,
    };
    const res = await sendOneReminder(payload);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: res.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("✅ Rappel 24h envoyé à:", clientEmail);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ send-booking-reminder-email:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
