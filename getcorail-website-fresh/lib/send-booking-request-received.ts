/**
 * Accusé de réception (demande reçue / devis à venir).
 * Préférence: RESEND_API_KEY côté serveur (ex. Vercel) — souvent manquant dans les secrets des Edge Functions.
 * Sinon: appelle l'Edge Function Supabase.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

type Channel = "marketplace" | "driver_page";

export type BookingRequestReceivedParams = {
  supabaseUrl: string;
  serviceRoleKey: string;
  clientEmail: string;
  clientName?: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  indicativeLowCents?: number | null;
  indicativeHighCents?: number | null;
  requestChannel: Channel;
};

const logPrefix = "[booking-confirmation-email]";

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDateTime(scheduledAt: string) {
  try {
    const d = new Date(scheduledAt);
    return {
      date: d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: escHtml(scheduledAt), time: "" };
  }
}

function formatRange(low?: number | null, high?: number | null) {
  if (low == null || high == null) return "Selon votre demande";
  return `${Math.round(low / 100)} € - ${Math.round(high / 100)} €`;
}

function buildHtml(p: BookingRequestReceivedParams) {
  const { date, time } = fmtDateTime(p.scheduledAt);
  const range = formatRange(p.indicativeLowCents, p.indicativeHighCents);
  const name = p.clientName ? escHtml(p.clientName) : "";
  const channelLabel =
    p.requestChannel === "driver_page"
      ? "Demande transmise directement au chauffeur"
      : "Demande publiée en recherche de chauffeur";
  return `
      <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; border:1px solid #e2e8f0; overflow:hidden;">
          <div style="padding:20px 22px; background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff;">
            <h1 style="margin:0; font-size:20px;">Nous avons bien reçu votre demande</h1>
            <p style="margin:8px 0 0; opacity:.95; font-size:14px;">Corail vous enverra le devis dès qu'il sera disponible.</p>
          </div>
          <div style="padding:22px;">
            <p style="margin:0 0 14px; color:#0f172a;">Bonjour ${name || "et merci"},</p>
            <p style="margin:0 0 16px; color:#334155;">Votre demande de réservation est bien enregistrée.</p>
            <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; background:#f8fafc;">
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Départ</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${escHtml(p.pickupAddress)}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Arrivée</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${escHtml(p.dropoffAddress)}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Date et heure</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${date}${time ? ` à ${time}` : ""}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Estimation indicative</p>
              <p style="margin:0; color:#0f172a; font-weight:600;">${escHtml(range)}</p>
            </div>
            <div style="margin-top:14px; padding:12px 14px; border-radius:10px; background:#eff6ff; border:1px solid #bfdbfe; color:#1e3a8a; font-size:13px;">
              ${channelLabel}
            </div>
            <p style="margin:16px 0 0; color:#475569; font-size:13px;">
              Vous recevrez un email avec un lien pour accepter ou refuser le devis du chauffeur.
            </p>
          </div>
        </div>
      </div>
    `;
}

function subjectFor(p: BookingRequestReceivedParams) {
  return p.requestChannel === "driver_page"
    ? "Corail - Votre demande a bien ete transmise au chauffeur"
    : "Corail - Votre demande de reservation a bien ete recue";
}

async function sendViaResendDirect(
  params: BookingRequestReceivedParams
): Promise<{ ok: boolean; status?: number; body?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key?.trim()) return { ok: false, body: "no RESEND_API_KEY" };
  const from = process.env.RESEND_FROM_EMAIL || "GetCorail <onboarding@resend.dev>";
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.clientEmail],
      subject: subjectFor(params),
      html: buildHtml(params),
    }),
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: text };
}

async function sendViaSupabaseEdge(params: BookingRequestReceivedParams): Promise<{
  ok: boolean;
  status?: number;
  body?: string;
}> {
  const res = await fetch(`${params.supabaseUrl}/functions/v1/send-booking-request-received-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.serviceRoleKey}`,
      apikey: params.serviceRoleKey,
    },
    body: JSON.stringify({
      clientEmail: params.clientEmail,
      clientName: params.clientName,
      pickupAddress: params.pickupAddress,
      dropoffAddress: params.dropoffAddress,
      scheduledAt: params.scheduledAt,
      indicativeLowCents: params.indicativeLowCents,
      indicativeHighCents: params.indicativeHighCents,
      requestChannel: params.requestChannel,
    }),
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body: text };
}

/**
 * Tente d’abord Resend via les variables d’environnement du serveur (Vercel), puis l’Edge Function.
 */
export async function sendBookingRequestReceivedEmail(logTag: string, params: BookingRequestReceivedParams) {
  try {
    const withKey = await sendViaResendDirect(params);
    if (withKey.ok) {
      return;
    }
    if (withKey.status != null) {
      console.warn(logPrefix, logTag, "Resend (serveur) HTTP", withKey.status, withKey.body);
    }

    const edge = await sendViaSupabaseEdge(params);
    if (edge.ok) {
      return;
    }
    console.warn(
      logPrefix,
      logTag,
      "Edge send-booking-request-received-email HTTP",
      edge.status,
      edge.body
    );
  } catch (e) {
    console.warn(logPrefix, logTag, e);
  }
}
