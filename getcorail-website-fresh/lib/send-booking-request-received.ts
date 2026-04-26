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
  if (low == null || high == null) return "Établie sur la base de votre itinéraire";
  return `${Math.round(low / 100)} € – ${Math.round(high / 100)} € (indicatif)`;
}

function buildHtml(p: BookingRequestReceivedParams) {
  const { date, time } = fmtDateTime(p.scheduledAt);
  const range = formatRange(p.indicativeLowCents, p.indicativeHighCents);
  const greeting = p.clientName?.trim()
    ? `Bonjour ${escHtml(p.clientName.trim())},`
    : "Bonjour,";
  const whenLine = time ? `${date} — ${time}` : date;
  const channelBlock =
    p.requestChannel === "driver_page"
      ? {
          kicker: "Votre chauffeur en a été informé",
          text: "Nous transmettons l’essentiel de votre message au professionnel que vous avez choisi. Il reviendra vers vous avec une proposition personnalisée, dans le respect des standards Corail.",
        }
      : {
          kicker: "Votre parcours est en recherche de partenaire",
          text: "Votre demande est proposée à notre réseau de chauffeurs sélectionnés. Le premier devis reçu, rédigé sur mesure, vous sera adressé par e-mail dès sa validation.",
        };

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0; padding:0; background-color:#f0eeeb; -webkit-font-smoothing:antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Corail confirme la prise en compte de votre demande de transport.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0eeeb; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; background-color:#ffffff; box-shadow:0 2px 24px rgba(20, 18, 16, 0.06);">
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #1c1917, #3f3a36, #a89078); line-height:4px; font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:40px 40px 12px; text-align:center;">
              <p style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#78716c;">
                Corail
              </p>
              <p style="margin:8px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#a8a29e;">
                Votre confirmation
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px; font-family:Georgia, 'Times New Roman', serif;">
              <h1 style="margin:0; font-size:28px; font-weight:400; line-height:1.25; letter-spacing:-0.02em; color:#0c0a09;">
                Votre demande a bien été enregistrée
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.65; color:#44403c;">
              <p style="margin:0 0 20px;">${greeting}</p>
              <p style="margin:0 0 20px;">Nous avons le plaisir de confirmer la <strong style="color:#1c1917; font-weight:600;">saisie de votre course</strong>. Cette étude fait désormais partie de nos dossiers prioritaires : un devis, rédigé pour vous, vous parviendra prochainement.</p>
              <p style="margin:0;">C’est le premier pas d’un service pensé pour l’exigence — ponctualité, discrétion, confort.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e7e5e4; background-color:#fafaf9;">
                <tr>
                  <td style="padding:24px 24px 8px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Départ</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${escHtml(
                      p.pickupAddress
                    )}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px; background-color:#e7e5e4; line-height:0; font-size:0; padding:0 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Arrivée</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${escHtml(
                      p.dropoffAddress
                    )}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px; background-color:#e7e5e4; line-height:0; font-size:0; padding:0 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Date &amp; heure</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${escHtml(
                      whenLine
                    )}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px; background-color:#e7e5e4; line-height:0; font-size:0; padding:0 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 24px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Indication tarifaire</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${escHtml(
                      range
                    )}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 0;">
              <div style="border-left:3px solid #a89078; padding:16px 20px; background-color:#f5f3f0;">
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#57534e;">
                  ${escHtml(channelBlock.kicker)}
                </p>
                <p style="margin:10px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:1.6; color:#44403c;">
                  ${escHtml(channelBlock.text)}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 40px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:1.65; color:#57534e;">
              <p style="margin:0 0 12px;">Vous serez notifié dès l’arrivée du devis. Un <strong style="color:#1c1917; font-weight:600;">lien sécurisé</strong> vous permettra d’y répondre en toute sérénité, sans quitter votre messagerie.</p>
              <p style="margin:0; font-size:13px; color:#a8a29e;">Pour toute question immédiate, reprenez contact avec l’adresse d’où provient ce message.</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e7e5e4; text-align:center; padding:32px 40px;">
              <p style="margin:0; font-family:Georgia, 'Times New Roman', serif; font-size:15px; line-height:1.5; color:#44403c;">Bien à vous,</p>
              <p style="margin:6px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:16px; letter-spacing:0.04em; color:#0c0a09;">L’équipe Corail</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:11px; line-height:1.5; color:#a8a29e; text-align:center; max-width:520px;">
          Cet e-mail a été généré automatiquement. Merci de ne pas y répondre s’il s’agit d’une adresse d’envoi noreply.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function subjectFor(p: BookingRequestReceivedParams) {
  return p.requestChannel === "driver_page"
    ? "Corail — Votre demande a été transmise au chauffeur"
    : "Corail — Nous avons reçu votre demande de réservation";
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
