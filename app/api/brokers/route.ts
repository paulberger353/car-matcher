import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { brokers, vehicles } from "@/lib/data";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = [...brokers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((b) => ({
      ...b,
      vehicle_count: vehicles.filter((v) => v.broker_id === b.id).length,
    }));

  return NextResponse.json({ brokers: result });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name: string; firma?: string | null; telefon?: string | null;
    email?: string | null; notizen?: string | null;
  };

  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const newId = brokers.length > 0 ? Math.max(...brokers.map((b) => b.id)) + 1 : 1;
  brokers.push({
    id: newId,
    name: body.name,
    firma: body.firma ?? null,
    telefon: body.telefon ?? null,
    email: body.email ?? null,
    notizen: body.notizen ?? null,
    created_at: new Date().toISOString(),
  });
  return NextResponse.json({ success: true, id: newId });
}
