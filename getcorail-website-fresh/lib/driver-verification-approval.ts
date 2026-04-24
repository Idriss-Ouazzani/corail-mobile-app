/** Aligné sur la logique mobile `computeAllVerificationDocsApproved` (même règles). */
export function computeAllVerificationDocsApproved(p: {
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
}): boolean {
  const vtcR = p.verification_vtc_card_status === "approved";
  const hasVtcV = !!(p.verification_vtc_card_url_verso && String(p.verification_vtc_card_url_verso).trim());
  const vtcV = p.verification_vtc_card_status_verso === "approved" || (!hasVtcV && vtcR);
  const vtcOk = vtcR && vtcV;

  const idType = (p.verification_id_document_type || "cni") as "cni" | "passport";
  const idR = p.verification_id_card_status === "approved";
  let idOk = false;
  if (idType === "passport") {
    idOk = idR;
  } else {
    const hasIdV = !!(p.verification_id_card_url_verso && String(p.verification_id_card_url_verso).trim());
    const idV = p.verification_id_card_status_verso === "approved" || (!hasIdV && idR);
    idOk = idR && idV;
  }

  const insOk = p.verification_insurance_status === "approved";
  return vtcOk && idOk && insOk;
}
