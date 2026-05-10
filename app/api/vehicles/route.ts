import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { runMatching } from "@/lib/matching";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    const vehicles = await db
      .prepare(
        `SELECT v.*, b.name as broker_name FROM vehicles v 
         LEFT JOIN brokers b ON v.broker_id = b.id 
         ORDER BY v.created_at DESC`
      )
      .all();

    return NextResponse.json({ vehicles: vehicles.results || [] });
  } catch (error) {
    console.error("Get vehicles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { typ, marke, modell, baujahr, km_stand, preis, farbe, broker_id, notizen } =
    await req.json();

  // Validierung
  if (!typ || !marke || !modell) {
    return NextResponse.json(
      { error: "Typ, Marke und Modell sind erforderlich" },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    const result = await db
      .prepare(
        `INSERT INTO vehicles (typ, marke, modell, baujahr, km_stand, preis, farbe, broker_id, notizen) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        typ,
        marke,
        modell,
        baujahr || null,
        km_stand || null,
        preis || null,
        farbe || null,
        broker_id || null,
        notizen || null
      )
      .run();

    // Run matching for new vehicle
    const newVehicle = {
      id: result.meta.last_row_id,
      typ,
      marke,
      modell,
      baujahr,
      km_stand,
      preis,
      farbe,
      broker_id,
      notizen,
    };

    await runMatching(db, newVehicle);

    return NextResponse.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("Create vehicle error:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
