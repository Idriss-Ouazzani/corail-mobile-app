import { createClient } from "@supabase/supabase-js";

let serverClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!serverClient) {
    serverClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return serverClient;
}
