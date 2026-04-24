import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";
import { createHmac } from "crypto";

const SALT = "corail-admin-getcorail";

export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "Admin non configuré (ADMIN_PASSWORD manquant)" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const expected = createHmac("sha256", password).update(SALT).digest("hex");
  const submitted = body.password
    ? createHmac("sha256", body.password).update(SALT).digest("hex")
    : "";

  if (submitted !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
