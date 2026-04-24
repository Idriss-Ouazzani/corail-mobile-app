/**
 * Fichiers du bucket `driver-verification` (privé, RLS strict) : on extrait
 * le chemin objet (depuis un chemin relatif ou une URL storage publique/sign).
 * L’ouverture se fait via GET /admin/api/verification-asset (session admin + service role + download), pas via auth Supabase côté navigateur.
 */

export function extractStorageObjectPath(
  stored: string | null | undefined,
  bucket: string
): string | null {
  if (stored == null) return null;
  const t = String(stored).trim();
  if (!t) return null;

  if (!/^https?:\/\//i.test(t)) {
    const p = t.replace(/^\//, "");
    return p || null;
  }

  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }

  const esc = bucket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(`/storage/v1/object/(?:public|sign)/${esc}/(.+)$`, "i");
  const m1 = u.pathname.match(re1);
  if (m1) {
    try {
      return decodeURIComponent(m1[1].replace(/\+/g, " "));
    } catch {
      return m1[1];
    }
  }

  const re2 = new RegExp(`/(?:public|sign)/${esc}/(.+)$`, "i");
  const m2 = u.pathname.match(re2);
  if (m2) {
    try {
      return decodeURIComponent(m2[1].replace(/\+/g, " "));
    } catch {
      return m2[1];
    }
  }

  // Fallback: tout chemin contenant "…/driver-verification/…" (autres hôtes / future API Supabase)
  const needle = `/${bucket}/`;
  const idx = t.indexOf(needle);
  if (idx >= 0) {
    let rest = t.slice(idx + needle.length);
    const end = rest.search(/[?#]/);
    if (end >= 0) rest = rest.slice(0, end);
    if (rest) {
      try {
        return decodeURIComponent(rest.replace(/\+/g, " "));
      } catch {
        return rest;
      }
    }
  }

  return null;
}

/** URL relative du site (cookie admin envoyé) pour afficher l’objet. */
export function toAdminVerificationAssetUrl(objectPath: string | null | undefined): string | null {
  if (objectPath == null) return null;
  const p = String(objectPath).trim();
  if (!p) return null;
  return `/admin/api/verification-asset?path=${encodeURIComponent(p)}`;
}

export function toAdminAssetUrlFromStored(
  stored: string | null | undefined,
  bucket: string
): string | null {
  return toAdminVerificationAssetUrl(extractStorageObjectPath(stored, bucket));
}
