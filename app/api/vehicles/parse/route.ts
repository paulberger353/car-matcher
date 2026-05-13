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
- "typ": "gesuch" wenn der Text eine Suchanfrage ist (Wörter wie "suche", "gesucht", "looking for", "wanted"). Sonst "angebot".
- Zahlen immer als Zahl, nicht als String. Beispiele: "98k" = 98000, "8500km" = 8500, "28.000€" = 28000, "VB 18500" = 18500.
- baujahr: nur setzen wenn explizit genannt. Jahresbereiche wie "2017-2020" den Mittelwert nehmen (2018). Wenn nicht genannt: null.
- km_stand: Abkürzungen auflösen: "78tkm" = 78000, "12k km" = 12000.
- farbe: nur die Farbe, keine Zusätze wie "metallic" weglassen — aber Markenfarben wie "Giallo Orion" vollständig übernehmen.
- notizen: ALLE zusätzlichen Informationen die nicht in andere Felder passen (Ausstattung, Zustand, Besonderheiten, Verhandlungsbasis etc.).
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
