import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const config = {
  auth: false,
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    return { date: esc(scheduledAt), time: "" };
  }
}

function formatRange(low?: number | null, high?: number | null) {
  if (low == null || high == null) return "Établie sur la base de votre itinéraire";
  return `${Math.round(low / 100)} € – ${Math.round(high / 100)} € (indicatif)`;
}

function buildEmailHtml(
  clientName: string | undefined,
  pickupAddress: string,
  dropoffAddress: string,
  date: string,
  time: string,
  range: string,
  requestChannel: string
) {
  const name = (clientName ?? "").trim();
  const greeting = name ? `Bonjour ${esc(name)},` : "Bonjour,";
  const whenLine = time ? `${date} — ${time}` : date;
  const ch =
    requestChannel === "driver_page"
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
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${esc(
                      pickupAddress
                    )}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px; background-color:#e7e5e4; line-height:0; font-size:0; padding:0 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Arrivée</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${esc(
                      dropoffAddress
                    )}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:1px; background-color:#e7e5e4; line-height:0; font-size:0; padding:0 24px;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#a8a29e;">Date &amp; heure</p>
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${esc(
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
                    <p style="margin:8px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:1.45; color:#0c0a09;">${esc(
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
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#57534e;">${esc(
                  ch.kicker
                )}</p>
                <p style="margin:10px 0 0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; line-height:1.6; color:#44403c;">${esc(
                  ch.text
                )}</p>
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
              <p style="margin:6px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:16px; letter-spacing:0.04em; color:#0c0a09;">L'équipe Corail</p>
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      clientEmail,
      clientName,
      pickupAddress,
      dropoffAddress,
      scheduledAt,
      indicativeLowCents,
      indicativeHighCents,
      requestChannel,
    } = await req.json();

    if (!clientEmail || !pickupAddress || !dropoffAddress || !scheduledAt) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "GetCorail <onboarding@resend.dev>";
    const { date, time } = fmtDateTime(scheduledAt);
    const range = formatRange(indicativeLowCents, indicativeHighCents);
    const html = buildEmailHtml(
      clientName,
      pickupAddress,
      dropoffAddress,
      date,
      time,
      range,
      String(requestChannel ?? "marketplace")
    );

    const subject =
      requestChannel === "driver_page"
        ? "Corail — Votre demande a été transmise au chauffeur"
        : "Corail — Nous avons reçu votre demande de réservation";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject,
        html,
      }),
    });

    const resendBody = await resendRes.text();
    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: "Resend error", details: resendBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
