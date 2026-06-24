import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { brokers, vehicles } from "@/lib/data";

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
  const idx = brokers.findIndex((b) => b.id === parseInt(id));
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    name: string; firma?: string | null; telefon?: string | null;
    email?: string | null; notizen?: string | null;
  };

  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  brokers[idx] = {
    ...brokers[idx],
    name: body.name,
    firma: body.firma ?? null,
    telefon: body.telefon ?? null,
    email: body.email ?? null,
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
  const numId = parseInt(id);

  const vehicleCount = vehicles.filter((v) => v.broker_id === numId).length;
  if (vehicleCount > 0) {
    return NextResponse.json(
      { error: "Broker still has vehicles and cannot be deleted" },
      { status: 400 }
    );
  }

  const idx = brokers.findIndex((b) => b.id === numId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  brokers.splice(idx, 1);
  return NextResponse.json({ success: true });
}
