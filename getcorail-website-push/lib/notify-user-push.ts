/**
 * Appelle l'Edge Function Supabase notify-user pour envoyer une push à un utilisateur.
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour l'authentification.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; sent?: number; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("[notify-user] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return { success: false, error: "Missing config" };
  }
  const functionsUrl = `${url.replace(/\/$/, "")}/functions/v1/notify-user`;
  try {
    const res = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ userId, title, body, data: data ?? {} }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("[notify-user] Error:", res.status, json);
      return { success: false, error: json.error ?? String(res.status) };
    }
    return { success: true, sent: json.sent };
  } catch (err) {
    console.error("[notify-user] Fetch error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
