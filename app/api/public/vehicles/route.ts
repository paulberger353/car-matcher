import { NextRequest, NextResponse } from "next/server";
import { vehicles, getBrokerName } from "@/lib/data";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const typ = searchParams.get("typ");
  const search = searchParams.get("search")?.toLowerCase();

  let result = [...vehicles];

  if (typ === "angebot" || typ === "gesuch") {
    result = result.filter((v) => v.typ === typ);
  }

  if (search) {
    result = result.filter(
      (v) =>
        v.marke.toLowerCase().includes(search) ||
        v.modell.toLowerCase().includes(search)
    );
  }

  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const public_fields = result.map(({ id, marke, modell, baujahr, km_stand, farbe, notizen, broker_id }) => ({
    id, marke, modell, baujahr, km_stand, farbe, notizen,
    broker_name: getBrokerName(broker_id),
  }));

  return NextResponse.json({ vehicles: public_fields });
}
