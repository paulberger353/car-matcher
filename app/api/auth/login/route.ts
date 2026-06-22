import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string };

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  const user = await db
    .prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: number; username: string; password_hash: string }>();

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Ungültige Zugangsdaten" }, { status: 401 });
  }

  const token = await signToken({ id: user.id, username: user.username });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return res;
}