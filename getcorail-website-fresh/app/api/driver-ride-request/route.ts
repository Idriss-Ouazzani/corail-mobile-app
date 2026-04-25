import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { sendPushToUser } from "@/lib/notify-user-push";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pickup_address,
      dropoff_address,
      scheduled_at,
      price_cents,
      distance_km,
      indicative_low_cents,
      indicative_high_cents,
      notes,
      client_name,
      client_email,
      client_phone,
      preferred_driver_id,
      fallback_to_marketplace,
    } = body as {
      pickup_address?: string;
      dropoff_address?: string;
      scheduled_at?: string;
      price_cents?: number | null;
      distance_km?: number;
      indicative_low_cents?: number;
      indicative_high_cents?: number;
      notes?: string;
      client_name?: string;
      client_email?: string;
      client_phone?: string;
      preferred_driver_id?: string;
      fallback_to_marketplace?: boolean;
    };

    if (!pickup_address?.trim() || !dropoff_address?.trim() || !scheduled_at) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (départ, arrivée, date/heure)" },
        { status: 400 }
      );
    }
    if (!preferred_driver_id?.trim()) {
      return NextResponse.json(
        { error: "Chauffeur non précisé" },
        { status: 400 }
      );
    }
    const email = client_email?.trim();
    const phone = client_phone?.trim().replace(/\s/g, "") || "";
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Indiquez au moins un email ou un numéro de téléphone." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: requestRow, error } = await supabase
      .from("driver_ride_requests")
      .insert({
        driver_id: preferred_driver_id.trim(),
        pickup_address: pickup_address.trim(),
        dropoff_address: dropoff_address.trim(),
        scheduled_at,
        price_cents:
          price_cents != null && Number.isFinite(Number(price_cents))
            ? Math.round(Number(price_cents))
            : null,
        indicative_low_cents:
          indicative_low_cents != null ? Math.round(indicative_low_cents) : null,
        indicative_high_cents:
          indicative_high_cents != null ? Math.round(indicative_high_cents) : null,
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

    if (error) {
      console.error("[driver-ride-request] Insert error:", error);
      return NextResponse.json(
        { error: error.message || "Erreur lors de la création de la demande" },
        { status: 500 }
      );
    }

    // Notifier le chauffeur (push)
    const driverId = preferred_driver_id.trim();
    sendPushToUser(
      driverId,
      "Nouvelle demande de course",
      "Une nouvelle demande de course vous a été adressée.",
      { type: "driver_ride_request", request_id: requestRow?.id }
    ).catch((err) => console.warn("[driver-ride-request] Push notification error:", err));

    return NextResponse.json({
      ok: true,
      request_id: requestRow?.id,
      created_at: requestRow?.created_at,
    });
  } catch (err: unknown) {
    console.error("[driver-ride-request] Error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
