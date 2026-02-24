import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { sendPushToUser } from "@/lib/notify-user-push";

/**
 * POST: créer une demande de course adressée à un chauffeur (depuis sa page publique).
 * Body: comme booking-request + preferred_driver_slug (slug du chauffeur) + fallback_to_marketplace (boolean).
 * Si preferred_driver_slug absent → comportement classique (créer une ride PUBLISHED dans rides).
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Configuration serveur manquante." },
      { status: 500 }
    );
  }

  let body: {
    pickup_address: string;
    dropoff_address: string;
    scheduled_at: string;
    price_cents: number;
    distance_km?: number;
    indicative_low_cents?: number;
    indicative_high_cents?: number;
    notes?: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    preferred_driver_slug?: string;
    fallback_to_marketplace?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const {
    pickup_address,
    dropoff_address,
    scheduled_at,
    price_cents,
    distance_km,
    notes,
    client_name,
    client_email,
    client_phone,
    preferred_driver_slug,
    fallback_to_marketplace,
  } = body;

  if (!pickup_address?.trim() || !dropoff_address?.trim() || !scheduled_at || price_cents == null) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants (départ, arrivée, date/heure, budget)" },
      { status: 400 }
    );
  }
  const email = (client_email ?? "").trim();
  const phone = (client_phone ?? "").trim().replace(/\s/g, "");
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Indiquez au moins un email ou un numéro de téléphone." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();

  if (preferred_driver_slug?.trim()) {
    const slug = preferred_driver_slug.toLowerCase().trim();
    const { data: profile, error: profileError } = await supabase
      .from("vtc_profiles")
      .select("user_id")
      .eq("slug", slug)
      .eq("is_public", true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Chauffeur introuvable. Vous pouvez réserver sans chauffeur préféré." },
        { status: 400 }
      );
    }

    const driverId = (profile as { user_id: string }).user_id;
    const { data: req, error: insertError } = await supabase
      .from("driver_ride_requests")
      .insert({
        driver_id: driverId,
        pickup_address: pickup_address.trim(),
        dropoff_address: dropoff_address.trim(),
        scheduled_at,
        price_cents: Math.round(price_cents),
        distance_km: distance_km != null ? Number(distance_km) : null,
        notes: notes?.trim() || null,
        client_name: client_name?.trim() || null,
        client_email: email || null,
        client_phone: phone || null,
        fallback_to_marketplace: Boolean(fallback_to_marketplace),
        status: "PENDING",
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[driver-booking-request] insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Notifier le chauffeur (push)
    sendPushToUser(
      driverId,
      "Nouvelle demande de course",
      "Une nouvelle demande de course vous a été adressée.",
      { type: "driver_ride_request", request_id: req?.id }
    ).catch((err) => console.warn("[driver-booking-request] Push notification error:", err));

    return NextResponse.json({
      ok: true,
      request_id: req?.id,
      created_at: (req as { created_at: string })?.created_at,
      message: "Votre demande a été envoyée au chauffeur. Vous serez recontacté rapidement.",
    });
  }

  // Pas de chauffeur préféré → annonce classique (rides)
  const CREATOR_ID_CLIENT_WEB = "corail-landing";
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .insert({
      creator_id: CREATOR_ID_CLIENT_WEB,
      pickup_address: pickup_address.trim(),
      dropoff_address: dropoff_address.trim(),
      scheduled_at,
      price_cents: Math.round(price_cents),
      status: "PUBLISHED",
      visibility: "PUBLIC",
      source: "client",
      distance_km: distance_km != null ? Number(distance_km) : null,
      notes: notes?.trim() || null,
      client_name: client_name?.trim() || null,
      client_email: email || null,
      client_phone: phone || null,
    })
    .select("id, created_at")
    .single();

  if (rideError) {
    console.error("[driver-booking-request] rides insert error:", rideError);
    return NextResponse.json({ error: rideError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ride_id: ride?.id,
    created_at: (ride as { created_at: string })?.created_at,
  });
}
