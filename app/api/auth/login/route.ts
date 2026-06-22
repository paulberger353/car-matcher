import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { users } from "@/lib/data";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string };

  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
