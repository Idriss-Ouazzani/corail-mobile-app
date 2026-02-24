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
      const res = NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
      return res;
    }

    const supabase = getSupabaseServer();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
    const userAgent = request.headers.get("user-agent") ?? "";

    const { data, error } = await supabase.rpc("accept_quote", {
      p_token: token,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("[quotes/accept]", error);
      if (wantsRedirect(request)) return redirectToQuote(token, request, error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const result = data as { success?: boolean; error?: string; quote_id?: string };
    if (result.success === false) {
      const errMsg = result.error ?? "Erreur";
      if (wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 400 }
      );
    }

    const quoteId = result.quote_id;
    if (quoteId) {
      const { data: quote } = await supabase
        .from("quotes")
        .select("driver_id")
        .eq("id", quoteId)
        .single();
      const driverId = (quote as { driver_id?: string } | null)?.driver_id;
      if (driverId) {
        sendPushToUser(
          driverId,
          "Devis accepté",
          "Un client a accepté votre devis.",
          { type: "quote_accepted", quote_id: quoteId }
        ).catch((err) => console.warn("[quotes/accept] Push notification error:", err));
      }
    }

    if (wantsRedirect(request)) return redirectToQuote(token, request);
    return NextResponse.json({ success: true, quote_id: quoteId });
  } catch (err: unknown) {
    console.error("[quotes/accept]", err);
    const { token } = await context.params;
    const errMsg = err instanceof Error ? err.message : "Erreur serveur";
    if (token && wantsRedirect(request)) return redirectToQuote(token, request, errMsg);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
