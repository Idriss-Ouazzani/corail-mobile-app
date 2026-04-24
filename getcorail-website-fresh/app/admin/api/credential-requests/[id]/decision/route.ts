import { NextResponse } from "next/server";
import { isAdminAuthenticatedForRequest } from "@/lib/admin-auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import { extractStorageObjectPath } from "@/lib/admin-verification-asset";

type Body = { action: "approve" | "reject"; note?: string };

async function longSignedUrl(supabase: ReturnType<typeof getSupabaseServer>, storedPath: string): Promise<string> {
  const path =
    extractStorageObjectPath(storedPath, "driver-verification")?.trim() || String(storedPath || "").trim();
  if (!path) {
    throw new Error("Chemin de document invalide.");
  }
  const { data, error } = await supabase.storage.from("driver-verification").createSignedUrl(path, 315360000);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Impossible de signer le document.");
  }
  return data.signedUrl;
}

/**
 * Applique la demande (users / vtc_profiles) et met la ligne en approved | rejected.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticatedForRequest(request))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Body JSON attendu" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "action: approve | reject" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: row, error: fErr } = await supabase.from("profile_credential_change_requests").select("*").eq("id", id).maybeSingle();

  if (fErr || !row) {
    return NextResponse.json({ error: fErr?.message || "Demande introuvable" }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const note = body.note?.trim() || null;

  if (body.action === "reject") {
    const { error: uErr } = await supabase
      .from("profile_credential_change_requests")
      .update({
        status: "rejected",
        admin_note: note,
        resolved_at: now,
      })
      .eq("id", id)
      .eq("status", "pending");
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // approve
  const userId = row.user_id as string;
  const requested = row.requested_value as string;
  const reqType = row.request_type as string;

  if (reqType === "phone") {
    const { error: pErr } = await supabase.from("users").update({ phone: requested }).eq("id", userId);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    await supabase.from("vtc_profiles").update({ phone: requested }).eq("user_id", userId);
  } else if (reqType === "vtc_number") {
    const { error: cErr } = await supabase
      .from("users")
      .update({ professional_card_number: requested, vtc_card_number: requested })
      .eq("id", userId);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const docPath = row.document_path as string | null;
    if (!docPath) {
      return NextResponse.json({ error: "Document recto manquant pour cette demande." }, { status: 400 });
    }
    try {
      const signR = await longSignedUrl(supabase, docPath);
      const vpUp: Record<string, unknown> = {
        verification_vtc_card_url: signR,
        verification_vtc_card_status: "approved",
      };
      const versoPath = row.document_path_verso as string | null | undefined;
      if (versoPath) {
        vpUp.verification_vtc_card_url_verso = await longSignedUrl(supabase, versoPath);
        vpUp.verification_vtc_card_status_verso = "approved";
      }
      const { error: vpE } = await supabase.from("vtc_profiles").update(vpUp).eq("user_id", userId);
      if (vpE) {
        return NextResponse.json(
          { error: vpE.message + " (vérifiez qu’un profil VTC existe pour ce compte.)" },
          { status: 500 }
        );
      }
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  } else if (reqType === "siret") {
    const { error: sErr } = await supabase.from("vtc_profiles").update({ siret: requested }).eq("user_id", userId);
    if (sErr) {
      return NextResponse.json(
        { error: sErr.message + " (vérifiez qu’un profil VTC existe pour ce compte.)" },
        { status: 500 }
      );
    }
  } else if (reqType === "insurance") {
    const docPath = row.document_path as string | null;
    if (!docPath) {
      return NextResponse.json({ error: "Pièce jointe manquante pour l’assurance." }, { status: 400 });
    }
    try {
      const signI = await longSignedUrl(supabase, docPath);
      const { error: insE } = await supabase
        .from("vtc_profiles")
        .update({
          verification_insurance_url: signI,
          verification_insurance_status: "approved",
        })
        .eq("user_id", userId);
      if (insE) {
        return NextResponse.json(
          { error: insE.message + " (vérifiez qu’un profil VTC existe pour ce compte.)" },
          { status: 500 }
        );
      }
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Type de demande inconnu" }, { status: 400 });
  }

  const { error: upErr } = await supabase
    .from("profile_credential_change_requests")
    .update({
      status: "approved",
      admin_note: note,
      resolved_at: now,
    })
    .eq("id", id)
    .eq("status", "pending");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
