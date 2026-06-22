import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { vehicles, getBrokerName } from "@/lib/data";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const typ = searchParams.get("typ");

  let result = [...vehicles].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (typ === "angebot" || typ === "gesuch") {
    result = result.filter((v) => v.typ === typ);
  }

  if (limit && !isNaN(parseInt(limit))) {
    result = result.slice(0, parseInt(limit));
  }

  const withBroker = result.map((v) => ({ ...v, broker_name: getBrokerName(v.broker_id) }));
  return NextResponse.json({ vehicles: withBroker });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { typ, marke, modell } = await req.json() as { typ: string; marke: string; modell: string };

  if (!typ || !marke || !modell) {
    return NextResponse.json({ error: "Type, make and model are required" }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: 999 });
}
