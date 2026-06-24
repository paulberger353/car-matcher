import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { vehicles, matches, getBrokerName } from "@/lib/data";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const typ = searchParams.get("typ");

  let result = [...vehicles].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (typ === "angebot" || typ === "gesuch") {
    result = result.filter((v) => v.typ === typ);
  }

  if (limit && !isNaN(parseInt(limit))) {
    result = result.slice(0, parseInt(limit));
  }

  const withBroker = result.map((v) => ({ ...v, broker_name: getBrokerName(v.broker_id) }));
  return NextResponse.json({ vehicles: withBroker });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    typ: string; marke: string; modell: string;
    baujahr?: number | null; km_stand?: number | null; preis?: number | null;
    farbe?: string | null; broker_id?: number | null; notizen?: string | null;
  };

  if (!body.typ || !body.marke || !body.modell) {
    return NextResponse.json({ error: "Type, make and model are required" }, { status: 400 });
  }

  const newId = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.id)) + 1 : 1;
  const newVehicle = {
    id: newId,
    typ: body.typ,
    marke: body.marke,
    modell: body.modell,
    baujahr: body.baujahr ?? null,
    km_stand: body.km_stand ?? null,
    preis: body.preis ?? null,
    farbe: body.farbe ?? null,
    broker_id: body.broker_id ?? null,
    notizen: body.notizen ?? null,
    created_at: new Date().toISOString(),
  };
  vehicles.push(newVehicle);

  const oppositeTyp = newVehicle.typ === "angebot" ? "gesuch" : "angebot";
  const counterparts = vehicles.filter(
    (v) => v.typ === oppositeTyp && v.id !== newId &&
    v.marke.toLowerCase() === newVehicle.marke.toLowerCase()
  );
  if (counterparts.length > 0) {
    const nextMatchId = matches.length > 0 ? Math.max(...matches.map((m) => m.id)) + 1 : 1;
    counterparts.forEach((cp, i) => {
      matches.push({
        id: nextMatchId + i,
        angebot_id: newVehicle.typ === "angebot" ? newId : cp.id,
        gesuch_id: newVehicle.typ === "gesuch" ? newId : cp.id,
        score: 75,
        gesehen: 0,
        status: "offen",
        status_at: null,
        created_at: new Date().toISOString(),
      });
    });
  }

  return NextResponse.json({ success: true, id: newId, matchCount: counterparts.length });
}
