import { NextResponse } from "next/server";
import { isAdminAuthenticatedForRequest } from "@/lib/admin-auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "driver-verification";

function guessContentType(path: string): string {
  const p = path.toLowerCase();
  if (p.endsWith(".pdf")) return "application/pdf";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".heic") || p.endsWith(".heif")) return "image/heic";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg") || p.endsWith(".jpe")) return "image/jpeg";
  if (p.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate", Vary: "Cookie" } as const;

type StBucket = {
  download: (p: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
  createSignedUrl: (p: string, t: number) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
  list: (path: string, o?: { limit?: number; sortBy?: { column: string; order: string } }) => Promise<{
    data: Array<{ name: string; id?: string | null; updated_at?: string; metadata?: { size?: number } | null }> | null;
    error: { message: string } | null;
  }>;
};

type BytesResult = {
  ab: ArrayBuffer;
  contentType: string;
  source: "fetch" | "download" | "list_sibling";
  /** Fichier réellement servi (si repli “dernier frère” dans le dossier). */
  resolvedPath?: string;
};

/**
 * 1) URL signée + fetch — uniquement HTTP 200 (pas 204/304, qui ont souvent 0 o mais ok=true).
 * 2) Repli: storage.download() côté SDK.
 */
async function loadObjectBytes(
  st: StBucket,
  objectPath: string,
  dev: boolean
): Promise<{ ok: true; result: BytesResult } | { ok: false; message: string; details?: string }> {
  const { data: signData, error: signErr } = await st.createSignedUrl(objectPath, 30 * 60);
  if (signErr || !signData?.signedUrl) {
    return { ok: false, message: "Impossible d’obtenir une URL signée (chemin ou clé service).", details: signErr?.message };
  }

  const r = await fetch(signData.signedUrl, { cache: "no-store" });
  // `response.ok` inclut 204, 206, 304… d’où réponses "vides" classées à tort comme OK
  if (r.status === 200) {
    const ab = await r.arrayBuffer();
    if (ab.byteLength > 0) {
      return {
        ok: true,
        result: {
          ab,
          contentType: r.headers.get("content-type") || guessContentType(objectPath),
          source: "fetch",
          resolvedPath: objectPath,
        },
      };
    }
    if (dev) {
      console.warn("[verification-asset] fetch 200 but 0 o", objectPath, "content-length", r.headers.get("content-length"));
    }
  } else {
    if (dev) {
      console.warn("[verification-asset] fetch signed URL", objectPath, "status", r.status);
    }
  }

  const { data: blob, error: downErr } = await st.download(objectPath);
  if (downErr || !blob) {
    return { ok: false, message: "Lecture via URL signée et download impossible.", details: downErr?.message };
  }
  const ab2 = await blob.arrayBuffer();
  if (ab2.byteLength > 0) {
    return {
      ok: true,
      result: { ab: ab2, contentType: guessContentType(objectPath), source: "download", resolvedPath: objectPath },
    };
  }

  return {
    ok: false,
    message:
      "Aucun octet lu : l’objet dans le bucket a probablement 0 o (envoi incomplété) ou l’enregistrement en base ne pointe plus sur le bon fichier. Refaire l’envoi des documents côté app, ou vérifier le chemin en base.",
  };
}

/** Cas fréquent : re-upload = nouveau {timestamp}.jpg, la base a encore l’ancien chemin. Tente d’ouvrir les objets du même sous-dossier, du plus “récent” (timestamp dans le nom) au plus ancien. */
async function tryLatestSiblingInFolder(
  st: StBucket,
  objectPath: string,
  dev: boolean
): Promise<{ ok: true; result: BytesResult } | { ok: false }> {
  const segs = objectPath.split("/").filter(Boolean);
  if (segs.length < 3) return { ok: false };
  const userId = segs[0];
  const docType = segs[1];
  if (!userId || !["vtc_card", "id_card", "insurance"].includes(docType)) {
    return { ok: false };
  }
  const folder = `${userId}/${docType}`;
  const { data: items, error: listErr } = await st.list(folder, { limit: 100 });
  if (listErr || !items?.length) {
    if (dev) console.warn("[verification-asset] list", folder, listErr?.message);
    return { ok: false };
  }

  const paths = items
    .filter((f) => f.name)
    .map((f) => {
      const full = `${folder}/${f.name}`;
      const base = String(f.name).replace(/\.[^.]+$/, "");
      const ts = parseInt(base, 10) || 0;
      return { full, ts };
    })
    .sort((a, b) => b.ts - a.ts)
    .map((x) => x.full);

  for (const p of paths) {
    const { data: signData, error: e } = await st.createSignedUrl(p, 5 * 60);
    if (e || !signData?.signedUrl) continue;
    const r = await fetch(signData.signedUrl, { cache: "no-store" });
    if (r.status === 200) {
      const ab = await r.arrayBuffer();
      if (ab.byteLength > 0) {
        if (dev && p !== objectPath) {
          console.warn("[verification-asset] sibling fallback", objectPath, "->", p);
        }
        return {
          ok: true,
          result: {
            ab,
            contentType: r.headers.get("content-type") || guessContentType(p),
            source: "list_sibling",
            resolvedPath: p,
          },
        };
      }
    }
  }
  return { ok: false };
}

export async function GET(request: Request) {
  const dev = process.env.NODE_ENV === "development";
  try {
    if (!(await isAdminAuthenticatedForRequest(request))) {
      return NextResponse.json(
        { error: "Non autorisé. Connecte-toi sur /admin/login puis ouvre le lien (même site / même navigateur)." },
        { status: 401, headers: noStore }
      );
    }

    const u = new URL(request.url);
    const objectPath = u.searchParams.get("path")?.trim() ?? "";
    if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/") || !objectPath.replace(/\s/g, "").length) {
      return NextResponse.json({ error: "Paramètre path manquant ou invalide" }, { status: 400, headers: noStore });
    }

    const st = (getSupabaseServer() as any).storage.from(BUCKET) as StBucket;
    let loaded = await loadObjectBytes(st, objectPath, dev);

    if (!loaded.ok) {
      const sibling = await tryLatestSiblingInFolder(st, objectPath, dev);
      if (sibling.ok) loaded = sibling;
    }

    if (!loaded.ok) {
      return NextResponse.json(
        { error: loaded.message, ...(dev && loaded.details ? { details: loaded.details } : {}), ...(dev ? { path: objectPath } : {}) },
        { status: 404, headers: noStore }
      );
    }

    const { ab, contentType, resolvedPath, source } = loaded.result;
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      Vary: "Cookie",
    };
    if (resolvedPath && (source === "list_sibling" || resolvedPath !== objectPath)) {
      headers["X-Storage-Resolved-Path"] = resolvedPath;
    }
    return new Response(ab, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[verification-asset] exception", msg, e);
    return NextResponse.json(
      {
        error: msg.includes("Missing NEXT_PUBLIC_SUPABASE")
          ? "Config Supabase manquante côté serveur (.env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."
          : msg,
      },
      { status: 500, headers: noStore }
    );
  }
}
