import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { sendPushToUser } from "@/lib/notify-user-push";

function wantsRedirect(request: NextRequest): boolean {
  const accept = request.headers.get("accept") ?? "";
  return !accept.includes("application/json");
}

function redirectToQuote(token: string, request: NextRequest, error?: string): NextResponse {
  const origin = request.nextUrl?.origin ?? request.url;
  const base = origin.startsWith("http") ? origin : `https://${request.headers.get("host") ?? "getcorail.com"}`;
  const path = `/q/${encodeURIComponent(token)}${error ? `?error=${encodeURIComponent(error)}` : ""}`;
  const url = new URL(path, base);
  return NextResponse.redirect(url);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      const res = NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
      return res;
    }

    const supabase = getSupabaseServer();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
    const userAgent = request.headers.get("user-agent") ?? "";

    const { data, error } = await supabase.rpc("accept_quote", {
      p_token: token,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("[quotes/accept]", error);
      if (wantsRedirect(request)) return redirectToQuote(token, request, error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const result = data as { success?: boolean; error?: string; quote_id?: string };
    if (result.success === false) {
      const errMsg = result.error ?? "Erreur";
      if (wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 400 }
      );
    }

    const quoteId = result.quote_id;
    if (quoteId) {
      const { data: fullQuote } = await supabase
        .from("quotes")
        .select(
          "id, driver_id, source_driver_request_id, source_ride_id, client_name, client_phone, client_email, pickup_address, dropoff_address, scheduled_date, scheduled_time, price_cents, notes, token"
        )
        .eq("id", quoteId)
        .single();
      const q = fullQuote as {
        id: string;
        driver_id: string;
        source_driver_request_id: string | null;
        source_ride_id: string | null;
        client_name: string;
        client_phone: string;
        client_email: string | null;
        pickup_address: string;
        dropoff_address: string;
        scheduled_date: string;
        scheduled_time: string;
        price_cents: number;
        notes: string | null;
        token: string;
      } | null;

      if (q?.source_driver_request_id) {
        const t = (q.scheduled_time || "12:00:00").length <= 5 ? `${q.scheduled_time}:00` : q.scheduled_time;
        const schedIso = new Date(`${q.scheduled_date}T${t}`).toISOString();
        const { data: pr, error: prErr } = await supabase
          .from("personal_rides")
          .insert({
            driver_id: q.driver_id,
            source: "DIRECT_CLIENT",
            pickup_address: q.pickup_address,
            dropoff_address: q.dropoff_address,
            scheduled_at: schedIso,
            price_cents: q.price_cents,
            client_name: q.client_name,
            client_phone: q.client_phone,
            client_email: q.client_email,
            notes: q.notes ? `${q.notes}\n(Devis accepté)` : "Devis accepté (page pro)",
            quote_id: q.id,
            status: "SCHEDULED",
          })
          .select("id")
          .single();
        if (prErr) {
          console.error("[quotes/accept] personal_rides insert", prErr);
        } else {
          const pid = (pr as { id: string })?.id;
          await supabase
            .from("driver_ride_requests")
            .update({
              status: "ACCEPTED",
              personal_ride_id: pid ?? null,
              responded_at: new Date().toISOString(),
            })
            .eq("id", q.source_driver_request_id);
        }
      }

      if (q?.source_ride_id) {
        const { error: rideUpdErr } = await supabase
          .from("rides")
          .update({
            quote_status: "ACCEPTED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", q.source_ride_id)
          .eq("picker_id", q.driver_id);
        if (rideUpdErr) {
          console.error("[quotes/accept] source ride update", rideUpdErr);
        }
      }

      const driverId =
        (fullQuote as { driver_id?: string } | null)?.driver_id ??
        (q as { driver_id?: string } | null)?.driver_id;
      if (driverId) {
        await supabase
          .from("in_app_notifications")
          .insert({
            user_id: driverId,
            type: "quote_accepted",
            title: "Devis accepté",
            body: "Le client a accepté votre devis. Course confirmée.",
          })
          .then(() => {})
          .catch((err) => console.warn("[quotes/accept] in-app notification insert:", err));
        sendPushToUser(
          driverId,
          "Devis accepté",
          "Un client a accepté votre devis.",
          { type: "quote_accepted", quote_id: quoteId }
        ).catch((err) => console.warn("[quotes/accept] Push notification error:", err));
      }
    }

    if (wantsRedirect(request)) return redirectToQuote(token, request);
    return NextResponse.json({ success: true, quote_id: quoteId });
  } catch (err: unknown) {
    console.error("[quotes/accept]", err);
    const { token } = await context.params;
    const errMsg = err instanceof Error ? err.message : "Erreur serveur";
    if (token && wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
