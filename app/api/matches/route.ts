import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { matches, vehicles, brokers } from "@/lib/data";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const filtered = matches.filter((m) => {
    if (m.status === "offen") return true;
    if (m.status_at && new Date(m.status_at) > sevenDaysAgo) return true;
    return false;
  });

  const result = [...filtered]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((m) => {
      const angebot = vehicles.find((v) => v.id === m.angebot_id);
      const gesuch = vehicles.find((v) => v.id === m.gesuch_id);
      const angebotBroker = angebot?.broker_id
        ? brokers.find((b) => b.id === angebot.broker_id)
        : null;
      const gesuchBroker = gesuch?.broker_id
        ? brokers.find((b) => b.id === gesuch.broker_id)
        : null;

      return {
        ...m,
        angebot_marke: angebot?.marke ?? null,
        angebot_modell: angebot?.modell ?? null,
        angebot_broker: angebotBroker?.name ?? null,
        gesuch_marke: gesuch?.marke ?? null,
        gesuch_modell: gesuch?.modell ?? null,
        gesuch_broker: gesuchBroker?.name ?? null,
      };
    });

  return NextResponse.json({ matches: result });
}
