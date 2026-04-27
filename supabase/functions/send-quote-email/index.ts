/**
 * Edge Function : send-quote-email
 * Envoie un devis VTC par email (Resend). Style aligné sur l’accusé de réception premium.
 *
 * POST /functions/v1/send-quote-email
 * Body: { clientEmail, clientName, quoteUrl, price, date?, time?, pickupAddress?, dropoffAddress?, driverName? }
 */

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

/** Attribut href : & et guillemets */
function escHref(u: string) {
  return u.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function buildQuoteEmailHtml(params: {
  clientName: string;
  price: string;
  quoteUrl: string;
  date: string;
  time: string;
  pickupAddress: string;
  dropoffAddress: string;
  driverName: string;
}) {
  const name = params.clientName.trim();
  const greeting = name ? `Bonjour ${esc(name)},` : "Bonjour,";
  const timeLine = params.time.trim()
    ? `<p style="margin:8px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:18px; font-weight:400; letter-spacing:0.04em; color:#0c0a09;">${esc(
        params.time.trim()
      )}</p>`
    : "";

  const hasRoute = Boolean(params.pickupAddress.trim() || params.dropoffAddress.trim());
  const hasHoraire = Boolean(params.date.trim() || params.time.trim());

  const dividerRow = `<tr>
                        <td style="padding:28px 28px 0;">
                          <p style="margin:0; height:1px; background-color:#d9d0c3; line-height:0; font-size:0;">&nbsp;</p>
                        </td>
                      </tr>`;

  const horaireRows =
    params.date.trim()
      ? (hasRoute ? dividerRow : "") +
        `<tr>
                        <td style="padding:${hasRoute ? "20px" : "28px"} 28px 32px;">
                          <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#7c6a5a;">Horaire souhaité</p>
                          <p style="margin:10px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:20px; font-weight:400; line-height:1.35; color:#0c0a09; letter-spacing:-0.01em;">${esc(
          params.date.trim()
        )}</p>
                          ${timeLine}
                        </td>
                      </tr>`
      : timeLine
      ? (hasRoute ? dividerRow : "") +
        `<tr>
                        <td style="padding:${hasRoute ? "20px" : "28px"} 28px 32px;">
                          <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#7c6a5a;">Horaire souhaité</p>
                          ${timeLine}
                        </td>
                      </tr>`
      : "";

  const itineraryBlock =
    hasRoute || hasHoraire
      ? `<p style="margin:0 0 18px; text-align:center; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:#78716c;">${
          hasRoute ? "Votre itinéraire" : "Horaire"
        }</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f4ef; border:1px solid #e5dfd6;">
                <tr>
                  <td style="width:16px; background:linear-gradient(180deg, #1c1917, #2d2824); line-height:0; font-size:0;">&nbsp;</td>
                  <td style="padding:0; vertical-align:top;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${
        params.pickupAddress.trim()
          ? `<tr>
                        <td style="padding:28px 28px 0;">
                          <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#7c6a5a;">Point de retrait</p>
                          <p style="margin:10px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:19px; font-weight:400; line-height:1.45; color:#0c0a09; letter-spacing:-0.01em;">${esc(
            params.pickupAddress.trim()
          )}</p>
                        </td>
                      </tr>`
          : ""
      }
                      ${
        params.pickupAddress.trim() && params.dropoffAddress.trim()
          ? `<tr>
                        <td style="text-align:center; padding:6px 28px 0;">
                          <p style="margin:0; font-size:20px; line-height:1; color:#a89078; font-family:Georgia, serif; font-style:italic;">↓</p>
                        </td>
                      </tr>`
          : ""
      }
                      ${
        params.dropoffAddress.trim()
          ? `<tr>
                        <td style="padding:${params.pickupAddress.trim() ? "8px" : "28px"} 28px 0;">
                          <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#7c6a5a;">Destination</p>
                          <p style="margin:10px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:19px; font-weight:400; line-height:1.45; color:#0c0a09; letter-spacing:-0.01em;">${esc(
            params.dropoffAddress.trim()
          )}</p>
                        </td>
                      </tr>`
          : ""
      }
                      ${hasHoraire ? horaireRows : ""}
                    </table>
                  </td>
                </tr>
              </table>`
      : "";

  const driverBlock = params.driverName.trim()
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr>
                  <td>
                    <div style="border-left:3px solid #a89078; padding:16px 20px; background-color:#f5f3f0;">
                      <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#57534e;">Chauffeur</p>
                      <p style="margin:10px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:17px; line-height:1.45; color:#0c0a09;">${esc(
      params.driverName.trim()
    )}</p>
                    </div>
                  </td>
                </tr>
              </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Votre devis — Corail</title>
</head>
<body style="margin:0; padding:0; background-color:#f0eeeb; -webkit-font-smoothing:antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Votre proposition de trajet Corail est disponible.
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
              <p style="margin:0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#78716c;">Corail</p>
              <p style="margin:8px 0 0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#a8a29e;">Votre devis</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px; font-family:Georgia, &quot;Times New Roman&quot;, serif;">
              <h1 style="margin:0; font-size:28px; font-weight:400; line-height:1.25; letter-spacing:-0.02em; color:#0c0a09;">Votre proposition de trajet</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.65; color:#44403c;">
              <p style="margin:0 0 20px;">${greeting}</p>
              <p style="margin:0;">Nous avons le plaisir de vous adresser une <strong style="color:#1c1917; font-weight:600;">proposition tarifaire</strong> pour votre course. Vous trouverez ci-dessous le détail et le lien pour en prendre connaissance.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fafaf9; border:1px solid #e7e5e4;">
                <tr>
                  <td style="padding:28px 28px 26px; text-align:center;">
                    <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:9px; letter-spacing:0.22em; text-transform:uppercase; color:#78716c;">Montant proposé</p>
                    <p style="margin:12px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:42px; font-weight:400; letter-spacing:-0.03em; line-height:1; color:#0c0a09;">${esc(
    params.price
  )}<span style="font-size:22px; color:#57534e; font-weight:400;">&nbsp;€</span></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 12px;">
              ${itineraryBlock}
              ${driverBlock}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 40px 28px;">
              <a href="${escHref(params.quoteUrl)}" style="display:inline-block; background-color:#1c1917; color:#fafaf9; text-decoration:none; padding:16px 40px; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:13px; letter-spacing:0.14em; text-transform:uppercase; border:1px solid #292524;">Consulter le devis</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="border-left:3px solid #a89078; padding:16px 20px; background-color:#f5f3f0;">
                <p style="margin:0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; color:#44403c;">Ce devis reste valable <strong style="color:#1c1917; font-weight:600;">48 heures</strong>. Pour confirmer votre réservation, utilisez le lien ci-dessus.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e7e5e4; text-align:center; padding:32px 40px;">
              <p style="margin:0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:15px; line-height:1.5; color:#44403c;">Bien à vous,</p>
              <p style="margin:6px 0 0; font-family:Georgia, &quot;Times New Roman&quot;, serif; font-size:16px; letter-spacing:0.04em; color:#0c0a09;">L’équipe Corail</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0; font-family:-apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size:11px; line-height:1.5; color:#a8a29e; text-align:center; max-width:520px;">
          Cet e-mail a été généré automatiquement. Si vous l’avez reçu par erreur, vous pouvez l’ignorer.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY non configuré");
      return new Response(JSON.stringify({ error: "Resend API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      clientEmail,
      clientName,
      quoteUrl,
      price,
      date = "",
      time = "",
      pickupAddress = "",
      dropoffAddress = "",
      driverName = "",
    } = body;

    if (!clientEmail || !clientName || !quoteUrl || price == null || price === "") {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceStr = typeof price === "number" ? String(price) : String(price).trim();

    const htmlContent = buildQuoteEmailHtml({
      clientName: String(clientName).trim(),
      price: priceStr,
      quoteUrl: String(quoteUrl).trim(),
      date: String(date ?? "").trim(),
      time: String(time ?? "").trim(),
      pickupAddress: String(pickupAddress ?? "").trim(),
      dropoffAddress: String(dropoffAddress ?? "").trim(),
      driverName: String(driverName ?? "").trim(),
    });

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "GetCorail <onboarding@resend.dev>";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject: "Corail — Votre devis",
        html: htmlContent,
      }),
    });

    const raw = await response.text();
    let data: { id?: string; message?: string } = {};
    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      console.error("Erreur Resend:", data);
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: data.id ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-quote-email:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
