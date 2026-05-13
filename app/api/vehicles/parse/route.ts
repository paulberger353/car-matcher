import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Text ist erforderlich" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const ai = env.AI;

  if (!ai) {
    return NextResponse.json({ error: "KI nicht verfügbar" }, { status: 200 });
  }

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `Du extrahierst Fahrzeugdaten aus Texten und antwortest NUR mit reinem JSON, ohne Markdown, ohne Erklärungen, ohne Code-Blöcke.

JSON-Felder: marke, modell, baujahr, km_stand, preis, farbe, typ, notizen

Regeln:
- "typ": "gesuch" wenn der Text eine Suchanfrage ist (Wörter wie "suche", "gesucht", "looking for", "wanted", "searching"). Sonst "angebot".
- Zahlen immer als Zahl (kein String). Beispiele: "98k" = 98000, "78tkm" = 78000, "28.000€" = 28000, "VB 18500" = 18500.
- km_stand: Wenn die Einheit "miles" oder "mi" ist, in km umrechnen (1 mile = 1.609 km, aufrunden auf ganze Zahl).
- preis: Immer in EUR. Wenn USD angegeben, mit 0.92 multiplizieren und auf ganze Zahl runden. Wenn GBP, mit 1.17 multiplizieren.
- baujahr: Nur setzen wenn explizit genannt. Jahresbereiche wie "2017-2020" → Mittelwert (2018). "2020 or newer" → 2020. Nicht genannt → null.
- farbe: Nur EINE Farbe eintragen. Markenfarben vollständig (z.B. "Giallo Orion", "Rosso Corsa", "Seneca Blue"). Bei mehreren Farben nur die erste nehmen.
- notizen: NUR Informationen die nicht in andere Felder passen: Ausstattung, Zustand, Besonderheiten, Extras. NICHT: Marke, Modell, Baujahr, Kilometerstand, Preis, Farbe, Typ wiederholen.
- Unbekannte Felder: null.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content: string =
      typeof response === "object" && response !== null && "response" in response
        ? String((response as { response: unknown }).response)
        : "";

    let parsed: Record<string, unknown> = {};
    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    // Normalize fields — ensure strings are strings, numbers are numbers
    const normalize = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") return val.trim() || null;
      if (Array.isArray(val)) return val.join(", ") || null;
      if (typeof val === "object") return null;
      return String(val);
    };

    const toNum = (val: unknown): number | null => {
      if (val === null || val === undefined) return null;
      const n = typeof val === "string" ? parseFloat(val.replace(/[^\d.]/g, "")) : Number(val);
      return isFinite(n) && n > 0 ? n : null;
    };

    const safe = {
      typ: normalize(parsed.typ),
      marke: normalize(parsed.marke),
      modell: normalize(parsed.modell),
      baujahr: toNum(parsed.baujahr),
      km_stand: toNum(parsed.km_stand),
      preis: toNum(parsed.preis),
      farbe: normalize(parsed.farbe),
      notizen: normalize(parsed.notizen),
    };

    return NextResponse.json({ success: true, data: safe });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Parse Fehler", data: {} }, { status: 200 });
  }
}
