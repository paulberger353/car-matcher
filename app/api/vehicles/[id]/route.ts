import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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
  const { typ, marke, modell, baujahr, km_stand, preis, farbe, broker_id, notizen } =
    await req.json();

  if (!typ || !marke || !modell) {
    return NextResponse.json(
      { error: "Typ, Marke und Modell sind erforderlich" },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    await db
      .prepare(
        `UPDATE vehicles SET typ = ?, marke = ?, modell = ?, baujahr = ?, km_stand = ?, preis = ?, farbe = ?, broker_id = ?, notizen = ? 
         WHERE id = ?`
      )
      .bind(
        typ,
        marke,
        modell,
        baujahr ?? null,
        km_stand ?? null,
        preis ?? null,
        farbe || null,
        broker_id || null,
        notizen || null,
        id
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 }
    );
  }
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

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    // Delete all matches associated with this vehicle (CASCADE)
    await db
      .prepare(`DELETE FROM matches WHERE angebot_id = ? OR gesuch_id = ?`)
      .bind(id, id)
      .run();

    // Delete the vehicle
    await db
      .prepare(`DELETE FROM vehicles WHERE id = ?`)
      .bind(id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
