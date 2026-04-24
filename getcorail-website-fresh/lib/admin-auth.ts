import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "admin_session";
const SALT = "corail-admin-getcorail";

function getToken(): string {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return "";
  return createHmac("sha256", password).update(SALT).digest("hex");
}

/** Lire le cookie `admin_session` quand `cookies()` de next/headers ne voit rien (Route Handlers / certains profils de dev). */
function parseAdminSessionValue(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const m = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
}

/** Même règle que isAdminAuthenticated, via l’en-tête `Cookie` (fiable dans les Route Handlers). */
export function isAdminRequestFromHeaders(request: { headers: Headers }): boolean {
  const t = getToken();
  if (!t) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[admin] ADMIN_PASSWORD manquant : le portail admin ne peut pas vérifier la session (défini .env.local)."
      );
    }
    return false;
  }
  const fromHeader = parseAdminSessionValue(request.headers.get("cookie"));
  return fromHeader === t;
}

/** d’abord l’en-tête `Cookie` (fiable côté Route Handlers), puis l’API `cookies()` (fallback RSC / cookies). */
export async function isAdminAuthenticatedForRequest(request: Request): Promise<boolean> {
  if (isAdminRequestFromHeaders(request)) return true;
  return isAdminAuthenticated();
}

export async function setAdminSession(): Promise<void> {
  const token = getToken();
  if (!token) return;
  const cookieStore = await cookies();
  // path "/" pour que le cookie soit toujours envoyé vers /admin/…, /admin/api/… (certains UAs sont pénibles avec path restreint)
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 0 };
  cookieStore.set(COOKIE_NAME, "", { ...base, path: "/admin" });
  cookieStore.set(COOKIE_NAME, "", { ...base, path: "/" });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  const token = getToken();
  if (!token || !cookie?.value) return false;
  return cookie.value === token;
}
