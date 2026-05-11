import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    const searchParams = req.nextUrl.searchParams;
    const typ = searchParams.get("typ");
    const search = searchParams.get("search");

    let query = `SELECT v.id, v.marke, v.modell, v.baujahr, v.km_stand, v.farbe, v.notizen, b.name as broker_name 
                 FROM vehicles v 
                 LEFT JOIN brokers b ON v.broker_id = b.id 
                 WHERE 1=1`;
    const params: (string | number)[] = [];

    // Filter by typ if specified
    if (typ && (typ === "angebot" || typ === "gesuch")) {
      query += ` AND v.typ = ?`;
      params.push(typ);
    }

    // Filter by search term (marke or modell)
    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (LOWER(v.marke) LIKE LOWER(?) OR LOWER(v.modell) LIKE LOWER(?))`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY v.created_at DESC`;

    let preparedQuery = db.prepare(query);
    if (params.length > 0) {
      preparedQuery = preparedQuery.bind(...params);
    }

    const result = await preparedQuery.all();

    return NextResponse.json({
      vehicles: result.results || [],
    });
  } catch (error) {
    console.error("Get public vehicles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
