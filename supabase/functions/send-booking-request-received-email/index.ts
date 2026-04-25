import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const config = {
  auth: false,
};

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
    return { date: scheduledAt, time: "" };
  }
}

function formatRange(low?: number | null, high?: number | null) {
  if (low == null || high == null) return "Selon votre demande";
  return `${Math.round(low / 100)} € - ${Math.round(high / 100)} €`;
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
    const channelLabel =
      requestChannel === "driver_page"
        ? "Demande transmise directement au chauffeur"
        : "Demande publiée en recherche de chauffeur";

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:14px; border:1px solid #e2e8f0; overflow:hidden;">
          <div style="padding:20px 22px; background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff;">
            <h1 style="margin:0; font-size:20px;">Nous avons bien reçu votre demande</h1>
            <p style="margin:8px 0 0; opacity:.95; font-size:14px;">Corail vous enverra le devis dès qu'il sera disponible.</p>
          </div>
          <div style="padding:22px;">
            <p style="margin:0 0 14px; color:#0f172a;">Bonjour ${clientName || "et merci"},</p>
            <p style="margin:0 0 16px; color:#334155;">Votre demande de réservation est bien enregistrée.</p>
            <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; background:#f8fafc;">
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Départ</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${pickupAddress}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Arrivée</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${dropoffAddress}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Date et heure</p>
              <p style="margin:0 0 10px; color:#0f172a; font-weight:600;">${date}${time ? ` à ${time}` : ""}</p>
              <p style="margin:0 0 6px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em;">Estimation indicative</p>
              <p style="margin:0; color:#0f172a; font-weight:600;">${range}</p>
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

    const subject =
      requestChannel === "driver_page"
        ? "Corail - Votre demande a bien ete transmise au chauffeur"
        : "Corail - Votre demande de reservation a bien ete recue";

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
