import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { vehicles } from "@/lib/data";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const marke = searchParams.get("marke") ?? "";
  const typ = searchParams.get("typ") ?? "angebot";

  const oppositeTyp = typ === "angebot" ? "gesuch" : "angebot";
  const count = vehicles.filter(
    (v) => v.typ === oppositeTyp && v.marke.toLowerCase() === marke.toLowerCase()
  ).length;

  return NextResponse.json({ count });
}
