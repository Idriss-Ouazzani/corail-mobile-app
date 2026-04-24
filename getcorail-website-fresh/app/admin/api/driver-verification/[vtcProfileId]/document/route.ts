import { NextResponse } from "next/server";
import { isAdminAuthenticatedForRequest } from "@/lib/admin-auth";
import { computeAllVerificationDocsApproved } from "@/lib/driver-verification-approval";
import { getSupabaseServer } from "@/lib/supabase-server";

type DocType =
  | "vtc_card"
  | "vtc_card_verso"
  | "id_card"
  | "id_card_verso"
  | "insurance";

type Body = {
  docType: DocType;
  status: "approved" | "rejected";
  adminNotes?: string | null;
};

function columnsForDocType(docType: DocType): { status: string; notes: string } {
  switch (docType) {
    case "vtc_card":
      return { status: "verification_vtc_card_status", notes: "verification_vtc_card_admin_notes" };
    case "vtc_card_verso":
      return {
        status: "verification_vtc_card_status_verso",
        notes: "verification_vtc_card_admin_notes_verso",
      };
    case "id_card":
      return { status: "verification_id_card_status", notes: "verification_id_card_admin_notes" };
    case "id_card_verso":
      return {
        status: "verification_id_card_status_verso",
        notes: "verification_id_card_admin_notes_verso",
      };
    case "insurance":
      return { status: "verification_insurance_status", notes: "verification_insurance_admin_notes" };
  }
}

const ALLOWED: DocType[] = ["vtc_card", "vtc_card_verso", "id_card", "id_card_verso", "insurance"];

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

  const { docType, status } = body;
  if (!docType || !ALLOWED.includes(docType)) {
    return NextResponse.json({ error: "docType invalide" }, { status: 400 });
  }
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status: approved | rejected" }, { status: 400 });
  }

  const { status: colStatus, notes: colNotes } = columnsForDocType(docType);

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
    return NextResponse.json(
      { error: "Ce dossier n’est plus en attente (déjà traité ou non pending)." },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {
    [colStatus]: status,
    [colNotes]: body.adminNotes?.trim() || null,
  };

  const { data: profileRow, error: updateError } = await (supabase as any)
    .from("vtc_profiles")
    .update(update)
    .eq("id", vtcProfileId)
    .select(
      "verification_vtc_card_status, verification_vtc_card_status_verso, verification_vtc_card_url, verification_vtc_card_url_verso, verification_id_card_status, verification_id_card_status_verso, verification_id_card_url, verification_id_card_url_verso, verification_id_document_type, verification_insurance_status"
    )
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  const profile = profileRow as {
    verification_vtc_card_status: string | null;
    verification_vtc_card_status_verso: string | null;
    verification_vtc_card_url: string | null;
    verification_vtc_card_url_verso: string | null;
    verification_id_card_status: string | null;
    verification_id_card_status_verso: string | null;
    verification_id_card_url: string | null;
    verification_id_card_url_verso: string | null;
    verification_id_document_type: string | null;
    verification_insurance_status: string | null;
  } | null;
  if (!profile) {
    return NextResponse.json({ error: "Mise à jour incomplète" }, { status: 500 });
  }

  const allApproved = computeAllVerificationDocsApproved(profile);
  if (allApproved) {
    await (supabase as any)
      .from("vtc_profiles")
      .update({
        driver_verification_status: "approved",
        driver_verification_reviewed_at: new Date().toISOString(),
        driver_verification_rejection_reason: null,
      })
      .eq("id", vtcProfileId);
  }

  return NextResponse.json({ ok: true, allApproved });
}
