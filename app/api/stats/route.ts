import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token || !(await verifyToken(token))) return NextResponse.json({}, { status: 401 });

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  const [angebote, gesuche, broker, matches] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'angebot'`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'gesuch'`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM brokers`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM matches WHERE gesehen = 0`).first<{ count: number }>(),
  ]);

  return NextResponse.json({
    angebote: angebote?.count || 0,
    gesuche: gesuche?.count || 0,
    broker: broker?.count || 0,
    matches: matches?.count || 0,
  });
}