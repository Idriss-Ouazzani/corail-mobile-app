import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CREATOR_ID_CLIENT_WEB = "corail-landing";

/** GET: vérifier que l’API est joignable (ouvrir /api/booking-request dans le navigateur) */
export async function GET() {
  return NextResponse.json({ ok: true, message: "API booking-request disponible" });
}

export async function POST(request: NextRequest) {
  console.log("[booking-request] POST reçu");
  try {
    return await handleBookingRequest(request);
  } catch (err: any) {
    console.error("[booking-request] Unhandled error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}

async function handleBookingRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[booking-request] Missing env: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      {
        error:
          "Configuration serveur manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans un fichier .env.local à la racine du projet landing (voir .env.example).",
      },
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
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { pickup_address, dropoff_address, scheduled_at, price_cents, distance_km, indicative_low_cents, indicative_high_cents, notes, client_name, client_email, client_phone } = body;
  if (!pickup_address?.trim() || !dropoff_address?.trim() || !scheduled_at || price_cents == null) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants (départ, arrivée, date/heure, budget)" },
      { status: 400 }
    );
  }
  const email = client_email?.trim();
  const phone = client_phone?.trim().replace(/\s/g, "") || "";
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Indiquez au moins un email ou un numéro de téléphone pour recevoir la confirmation de votre réservation." },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  } catch (createErr: any) {
    console.error("[booking-request] Supabase createClient:", createErr);
    return NextResponse.json(
      { error: "Erreur de configuration Supabase. Vérifiez l'URL et la clé dans .env.local." },
      { status: 500 }
    );
  }

  let ride: { id: string; created_at: string } | null = null;
  let error: { message: string } | null = null;
  try {
    const result = await supabase
      .from("rides")
      .insert({
      creator_id: CREATOR_ID_CLIENT_WEB,
      pickup_address: pickup_address.trim(),
      dropoff_address: dropoff_address.trim(),
      scheduled_at: scheduled_at,
      price_cents: Math.round(price_cents),
      status: "PUBLISHED",
      visibility: "PUBLIC",
      source: "client",
      distance_km: distance_km != null ? Number(distance_km) : null,
      indicative_low_cents: indicative_low_cents != null ? Math.round(indicative_low_cents) : null,
      indicative_high_cents: indicative_high_cents != null ? Math.round(indicative_high_cents) : null,
      notes: notes?.trim() || null,
      client_name: client_name?.trim() || null,
      client_email: email || null,
      client_phone: phone || null,
    })
      .select("id, created_at")
      .single();
    ride = result.data;
    error = result.error;
  } catch (networkErr: any) {
    console.error("[booking-request] Network/insert error:", networkErr);
    return NextResponse.json(
      {
        error:
          "Impossible de contacter la base de données. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local, et votre connexion internet.",
      },
      { status: 500 }
    );
  }

  if (error) {
    console.error("[booking-request] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ride) {
    return NextResponse.json({ error: "Aucune donnée reçue après création." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ride_id: ride.id, created_at: ride.created_at });
}
