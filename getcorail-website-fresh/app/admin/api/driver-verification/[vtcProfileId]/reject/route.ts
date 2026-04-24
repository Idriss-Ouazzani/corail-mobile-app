import { NextResponse } from "next/server";
import { isAdminAuthenticatedForRequest } from "@/lib/admin-auth";
import { getSupabaseServer } from "@/lib/supabase-server";

type Body = { reason: string };

export async function POST(
  request: Request,
  context: { params: Promise<{ vtcProfileId: string }> }
) {
  if (!(await isAdminAuthenticatedForRequest(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { vtcProfileId } = await context.params;
  if (!vtcProfileId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body JSON attendu" }, { status: 400 });
  }

  const reason = body.reason?.trim() || "";
  if (!reason) {
    return NextResponse.json({ error: "Une raison est requise" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data: existingRow, error: exErr } = await supabase
    .from("vtc_profiles")
    .select("id, driver_verification_status")
    .eq("id", vtcProfileId)
    .maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
  const existing = existingRow as { id: string; driver_verification_status: string | null } | null;
  if (!existing) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  if (existing.driver_verification_status !== "pending") {
    return NextResponse.json({ error: "Ce dossier n’est plus en attente." }, { status: 400 });
  }

  const { error } = await (supabase as any)
    .from("vtc_profiles")
    .update({
      driver_verification_status: "rejected",
      driver_verification_reviewed_at: new Date().toISOString(),
      driver_verification_rejection_reason: reason,
    })
    .eq("id", vtcProfileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
