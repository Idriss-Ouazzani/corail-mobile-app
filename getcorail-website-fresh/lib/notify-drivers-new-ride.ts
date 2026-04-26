/**
 * Appelle l’edge Supabase `send-ride-notification` (service role) pour diffuser
 * une push à tous les chauffeurs (annonces PUBLIC créées côté site, sans pass par l’app).
 */
export async function notifyDriversNewPublicRide(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  rideId: string;
}): Promise<void> {
  const url = `${params.supabaseUrl.replace(/\/$/, "")}/functions/v1/send-ride-notification`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.serviceRoleKey}`,
      },
      body: JSON.stringify({ rideId: params.rideId, visibility: "PUBLIC" }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("[notifyDriversNewPublicRide] HTTP", res.status, t);
    }
  } catch (e) {
    console.warn("[notifyDriversNewPublicRide]", e);
  }
}
