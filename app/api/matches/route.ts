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
    const matches = await db
      .prepare(
        `SELECT m.*,
                a.marke as angebot_marke, a.modell as angebot_modell, ab.name as angebot_broker,
                g.marke as gesuch_marke, g.modell as gesuch_modell, gb.name as gesuch_broker
         FROM matches m
         JOIN vehicles a ON m.angebot_id = a.id
         JOIN vehicles g ON m.gesuch_id = g.id
         LEFT JOIN brokers ab ON a.broker_id = ab.id
         LEFT JOIN brokers gb ON g.broker_id = gb.id
         WHERE m.status = 'offen'
            OR (m.status IN ('vermittelt', 'geplatzt')
                AND m.status_at > datetime('now', '-7 days'))
         ORDER BY m.created_at DESC`
      )
      .all();

    return NextResponse.json({ matches: matches.results || [] });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
