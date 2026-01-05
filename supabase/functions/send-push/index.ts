/**
 * Supabase Edge Function : send-push
 * 
 * Envoie des notifications push via l'API Expo Push Notification
 * Appelée par les triggers SQL ou manuellement via API
 * 
 * URL : https://[PROJECT_ID].supabase.co/functions/v1/send-push
 * Auth : Requiert l'Anon Key ou Service Role Key de Supabase
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface PushNotificationRequest {
  tokens: string | string[];        // Token(s) Expo
  title: string;                    // Titre de la notification
  body: string;                     // Corps de la notification
  data?: Record<string, any>;       // Données custom
  sound?: "default" | null;         // Son (default ou null)
  badge?: number;                   // Badge count iOS
  priority?: "default" | "normal" | "high";
  channelId?: string;               // Android channel ID
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: any;
}

// Configuration Expo Push API
const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const MAX_PUSH_BATCH_SIZE = 100; // Limite Expo : 100 notifications par batch

/**
 * Valider les tokens Expo
 */
function isValidExpoToken(token: string): boolean {
  return /^ExponentPushToken\[[^\]]+\]$/.test(token) || 
         /^ExpoPushToken\[[^\]]+\]$/.test(token) ||
         /^[a-zA-Z0-9_-]{22}$/.test(token); // Format Android/iOS
}

/**
 * Envoyer des notifications push via l'API Expo
 */
async function sendExpoPushNotifications(
  messages: PushNotificationRequest[]
): Promise<ExpoTicket[]> {
  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Expo API Error:", error);
      throw new Error(`Expo API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data as ExpoTicket[];
  } catch (error) {
    console.error("❌ Error sending push notifications:", error);
    throw error;
  }
}

/**
 * Diviser un tableau en chunks pour respecter la limite de batch Expo
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Handler principal
 */
serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 Vérifier l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser le body
    const body: PushNotificationRequest = await req.json();
    const { tokens, title, body: messageBody, data, sound, badge, priority, channelId } = body;

    // Validation
    if (!tokens || !title || !messageBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tokens, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normaliser tokens en array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Filtrer les tokens valides
    const validTokens = tokenArray.filter(isValidExpoToken);
    
    if (validTokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid Expo push tokens provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📱 Sending push to ${validTokens.length} device(s)`);

    // Préparer les messages Expo
    const messages: PushNotificationRequest[] = validTokens.map((token) => ({
      tokens: token,
      title,
      body: messageBody,
      data: data || {},
      sound: sound || "default",
      badge: badge,
      priority: priority || "high",
      channelId: channelId || "default",
    }));

    // Diviser en batches si nécessaire
    const batches = chunk(messages, MAX_PUSH_BATCH_SIZE);
    let allTickets: ExpoTicket[] = [];

    for (const batch of batches) {
      const tickets = await sendExpoPushNotifications(batch);
      allTickets = allTickets.concat(tickets);
    }

    // Compter les succès/erreurs
    const successCount = allTickets.filter((t) => t.status === "ok").length;
    const errorCount = allTickets.filter((t) => t.status === "error").length;

    console.log(`✅ Push sent: ${successCount} success, ${errorCount} errors`);

    // Désactiver les tokens invalides dans la base
    const invalidTokens = allTickets
      .filter((t, i) => t.status === "error" && t.details?.error === "DeviceNotRegistered")
      .map((t, i) => validTokens[i]);

    if (invalidTokens.length > 0) {
      console.log(`🗑️ Deactivating ${invalidTokens.length} invalid tokens`);
      
      for (const token of invalidTokens) {
        await supabase
          .from("push_tokens")
          .update({ is_active: false })
          .eq("push_token", token);
      }
    }

    // Retourner le résultat
    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: errorCount,
        tickets: allTickets,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-push function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
