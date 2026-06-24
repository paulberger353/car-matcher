import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { vehicles } from "@/lib/data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idx = vehicles.findIndex((v) => v.id === parseInt(id));
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    typ: string; marke: string; modell: string;
    baujahr?: number | null; km_stand?: number | null; preis?: number | null;
    farbe?: string | null; broker_id?: number | null; notizen?: string | null;
  };

  if (!body.typ || !body.marke || !body.modell) {
    return NextResponse.json({ error: "Type, make and model are required" }, { status: 400 });
  }

  vehicles[idx] = {
    ...vehicles[idx],
    typ: body.typ,
    marke: body.marke,
    modell: body.modell,
    baujahr: body.baujahr ?? null,
    km_stand: body.km_stand ?? null,
    preis: body.preis ?? null,
    farbe: body.farbe ?? null,
    broker_id: body.broker_id ?? null,
    notizen: body.notizen ?? null,
  };

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idx = vehicles.findIndex((v) => v.id === parseInt(id));
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  vehicles.splice(idx, 1);
  return NextResponse.json({ success: true });
}
