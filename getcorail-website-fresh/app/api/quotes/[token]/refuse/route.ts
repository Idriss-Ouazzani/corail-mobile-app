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
      return NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: quote } = await supabase
      .from("quotes")
      .select("driver_id")
      .eq("token", token)
      .single();
    const driverId = (quote as { driver_id?: string } | null)?.driver_id;

    const { data: beforeQuote } = await supabase
      .from("quotes")
      .select("id, source_driver_request_id, source_ride_id, price_cents")
      .eq("token", token)
      .single();

    const { data, error } = await supabase.rpc("refuse_quote", { p_token: token });

    if (error) {
      console.error("[quotes/refuse]", error);
      if (wantsRedirect(request)) return redirectToQuote(token, request, error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const result = data as { success?: boolean; error?: string };
    if (result.success === false) {
      const errMsg = result.error ?? "Erreur";
      if (wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 400 }
      );
    }

    if (driverId) {
      sendPushToUser(
        driverId,
        "Devis refusé",
        "Un client a refusé votre devis.",
        { type: "quote_refused" }
      ).catch((err) => console.warn("[quotes/refuse] Push notification error:", err));
    }

    const sdr = (beforeQuote as { source_driver_request_id?: string | null; price_cents?: number } | null)
      ?.source_driver_request_id;
    const sourceRideId = (beforeQuote as { source_ride_id?: string | null } | null)?.source_ride_id;
    if (sdr) {
      const { data: reqRow, error: reqErr } = await supabase
        .from("driver_ride_requests")
        .select("*")
        .eq("id", sdr)
        .single();
      if (!reqErr && reqRow) {
        const r = reqRow as {
          pickup_address: string;
          dropoff_address: string;
          scheduled_at: string;
          distance_km: number | null;
          indicative_low_cents: number | null;
          indicative_high_cents: number | null;
          notes: string | null;
          client_name: string | null;
          client_email: string | null;
          client_phone: string | null;
        };
        const refusedCents = (beforeQuote as { price_cents?: number })?.price_cents ?? 0;
        const CREATOR_ID = "corail-landing";
        const { data: newRide, error: rideInsErr } = await supabase
          .from("rides")
          .insert({
            creator_id: CREATOR_ID,
            pickup_address: r.pickup_address,
            dropoff_address: r.dropoff_address,
            scheduled_at: r.scheduled_at,
            price_cents: null,
            last_refused_quote_cents: refusedCents,
            distance_km: r.distance_km,
            indicative_low_cents: r.indicative_low_cents,
            indicative_high_cents: r.indicative_high_cents,
            notes: r.notes,
            client_name: r.client_name,
            client_email: r.client_email,
            client_phone: r.client_phone,
            status: "PUBLISHED",
            visibility: "PUBLIC",
            source: "client",
          })
          .select("id")
          .single();
        if (!rideInsErr && newRide) {
          await supabase
            .from("driver_ride_requests")
            .update({
              status: "CLOSED",
              published_ride_id: (newRide as { id: string }).id,
              active_quote_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sdr);
        } else {
          console.error("[quotes/refuse] republication annonce", rideInsErr);
        }
      }
    }

    if (sourceRideId) {
      const refusedCents = (beforeQuote as { price_cents?: number })?.price_cents ?? 0;
      const { error: rideReopenErr } = await supabase
        .from("rides")
        .update({
          status: "PUBLISHED",
          picker_id: null,
          price_cents: null,
          quote_status: "REFUSED",
          last_refused_quote_cents: refusedCents,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceRideId);
      if (rideReopenErr) {
        console.error("[quotes/refuse] source ride reopen error:", rideReopenErr);
      }
    }

    if (wantsRedirect(request)) return redirectToQuote(token, request);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[quotes/refuse]", err);
    const { token } = await context.params;
    const errMsg = err instanceof Error ? err.message : "Erreur serveur";
    if (token && wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
