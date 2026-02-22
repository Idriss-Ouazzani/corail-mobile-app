/**
 * Edge Function : notify-user
 *
 * Envoie une notification push à un utilisateur par son ID.
 * Récupère les tokens actifs dans push_tokens et appelle l'API Expo.
 *
 * Body: { userId: string, title: string, body: string, data?: Record<string, any> }
 * Auth: Authorization header requis (Bearer service role ou anon).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

function isValidExpoToken(token: string): boolean {
  return (
    /^ExponentPushToken\[[^\]]+\]$/.test(token) ||
    /^ExpoPushToken\[[^\]]+\]$/.test(token) ||
    /^[a-zA-Z0-9_-]{22}$/.test(token)
  );
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { userId, title, body: messageBody, data } = body as {
      userId?: string;
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
    };

    if (!userId || !title || !messageBody) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: userId, title, body",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: rows, error: fetchError } = await supabase
      .from("push_tokens")
      .select("push_token")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (fetchError) {
      console.error("notify-user fetch tokens error:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokens = (rows || [])
      .map((r: { push_token: string }) => r.push_token)
      .filter(isValidExpoToken);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active push tokens" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = tokens.map((token: string) => ({
      to: token,
      title,
      body: messageBody,
      data: data || {},
      sound: "default" as const,
      priority: "high" as const,
    }));

    const response = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    const tickets = result.data || [];
    const successCount = tickets.filter((t: { status: string }) => t.status === "ok").length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: tokens.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notify-user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
