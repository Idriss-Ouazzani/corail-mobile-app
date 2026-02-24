/**
 * Edge Function : admin-create-signed-url
 *
 * Génère une URL signée pour un fichier du bucket driver-verification en utilisant
 * la clé service role (contourne les RLS). Réservé aux admins.
 *
 * Body: { path: string }
 * Headers: Authorization: Bearer <access_token> (JWT de l'utilisateur connecté)
 *
 * Secrets: SERVICE_ROLE_KEY (ou SUPABASE_SERVICE_ROLE_KEY), SUPABASE_URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Nécessaire : l'app envoie Authorization: Bearer ANON_KEY + JWT user dans x-user-token
export const config = { auth: false };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // L'app envoie le JWT utilisateur dans x-user-token, et l'anon key dans Authorization
    const token = req.headers.get("x-user-token")?.trim()
      ?? req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path.trim() : "";
    if (!path) {
      return new Response(JSON.stringify({ error: "Missing path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: byId } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .eq("is_admin", true)
      .maybeSingle();
    const { data: byEmail } = !byId && user.email
      ? await supabase.from("users").select("id").eq("email", user.email).eq("is_admin", true).maybeSingle()
      : { data: null };

    if (!byId && !byEmail?.data) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signData, error: signError } = await supabase.storage
      .from("driver-verification")
      .createSignedUrl(path, 86400); // 24h, comme les URLs longues durée pour les photos

    if (signError || !signData?.signedUrl) {
      console.error("createSignedUrl error:", signError?.message);
      return new Response(
        JSON.stringify({ error: signError?.message ?? "Failed to create signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ url: signData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-create-signed-url error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
