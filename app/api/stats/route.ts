import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { vehicles, brokers, matches } from "@/lib/data";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token || !(await verifyToken(token))) return NextResponse.json({}, { status: 401 });

  const angebote = vehicles.filter((v) => v.typ === "angebot").length;
  const gesuche = vehicles.filter((v) => v.typ === "gesuch").length;
  const broker = brokers.length;
  const offeneMatches = matches.filter((m) => m.status === "offen").length;
  const neueMatches = matches.filter((m) => m.status === "offen" && m.gesehen === 0).length;

  return NextResponse.json({ angebote, gesuche, broker, matches: offeneMatches, neueMatches });
}
