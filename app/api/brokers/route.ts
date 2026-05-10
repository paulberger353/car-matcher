import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    const brokers = await db
      .prepare(
        `SELECT b.*, COUNT(v.id) as vehicle_count FROM brokers b 
         LEFT JOIN vehicles v ON b.id = v.broker_id 
         GROUP BY b.id 
         ORDER BY b.created_at DESC`
      )
      .all();

    return NextResponse.json({ brokers: brokers.results || [] });
  } catch (error) {
    console.error("Get brokers error:", error);
    return NextResponse.json({ error: "Failed to fetch brokers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, kontakt } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    const result = await db
      .prepare(
        `INSERT INTO brokers (name, kontakt) 
         VALUES (?, ?)`
      )
      .bind(name, kontakt || null)
      .run();

    return NextResponse.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("Create broker error:", error);
    return NextResponse.json(
      { error: "Failed to create broker" },
      { status: 500 }
    );
  }
}
