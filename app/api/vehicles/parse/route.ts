import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const SYSTEM_PROMPT = `You are a vehicle data extraction expert. Extract structured vehicle data from the input text.

FIELD RULES:

typ — "angebot" (listing / for sale) or "gesuch" (wanted / looking to buy).
  Angebot keywords: biete, verkaufe, zu verkaufen, for sale, selling, angebot.
  Gesuch keywords: suche, gesucht, wanted, looking for, searching, kaufe, buying.
  Default when unclear: "angebot".

marke — Manufacturer brand. Standardise spelling: "Mercedes" → "Mercedes-Benz", "VW" → "Volkswagen", "Lambo" → "Lamborghini". null if not found.

modell — Full model name including all trim/variant info (e.g. "M3 Competition", "911 GT3", "S63 AMG 4MATIC+", "Huracán LP 610-4", "R8 V10 Plus"). null if not found.

baujahr — Year of manufacture as integer.
  Variants: "Bj. 22" → 2022, "22er" → 2022, "'21" → 2021, "2021/22" → 2022, year range "2018-2020" → 2019.
  For gesuch "2020 or newer" → 2020, "ab 2021" → 2021. null if not mentioned.

km_stand — Mileage as integer.
  Formats: "78tkm" → 78000, "78.000 km" → 78000, "98k km" → 98000, "78 Tkm" → 78000.
  Miles: keep the raw number (e.g. "30000 miles" → 30000); server converts miles→km separately.
  For gesuch this is the MAXIMUM acceptable mileage. null if not mentioned.

preis — Price in EUR as integer.
  Formats: "84.900 €" → 84900, "85k" → 85000, "VB 85.000" → 85000, "ca. 90.000" → 90000.
  Ranges: for angebot use lower bound; for gesuch use upper bound.
  Currency: USD → multiply by 0.92; GBP → multiply by 1.17. Round to integer. null if not mentioned.

farbe — Single colour only. Preserve full brand colour names ("Frozen Black Metallic", "Giallo Orion", "Rosso Corsa", "Obsidian Black Metallic"). If multiple colours mentioned use the first. null if not mentioned.

notizen — Only extras NOT covered by other fields: equipment list, condition (unfallfrei, Unfallschaden), service history, modifications, number of owners, special features. Do NOT repeat make, model, year, mileage, price, or colour here. null if nothing extra.

EXAMPLES:

Input: "Biete BMW M3 Competition, Bj. 2022, 15.200 km, Frozen Black Metallic, 84.900€ VB, Carbon-Paket, unfallfrei, Scheckheft gepflegt"
Output: {"typ":"angebot","marke":"BMW","modell":"M3 Competition","baujahr":2022,"km_stand":15200,"preis":84900,"farbe":"Frozen Black Metallic","notizen":"Carbon-Paket, unfallfrei, Scheckheft gepflegt"}

Input: "Suche Porsche 911 GT3 (992), max Bj. 2022, max 15.000 km, Budget bis 195.000€"
Output: {"typ":"gesuch","marke":"Porsche","modell":"911 GT3","baujahr":2022,"km_stand":15000,"preis":195000,"farbe":null,"notizen":null}

Input: "Mercedes S63 AMG 4MATIC+ 2021, 22.400km, Obsidian Black Metallic, 148.500€, Burmester 3D Surround, Panorama-Schiebedach, HUD, 1 Vorbesitzer"
Output: {"typ":"angebot","marke":"Mercedes-Benz","modell":"S63 AMG 4MATIC+","baujahr":2021,"km_stand":22400,"preis":148500,"farbe":"Obsidian Black Metallic","notizen":"Burmester 3D Surround, Panorama-Schiebedach, HUD, 1 Vorbesitzer"}

Input: "Looking for a Ferrari 488 GTB, 2019 or newer, under 30000 miles, up to €220,000"
Output: {"typ":"gesuch","marke":"Ferrari","modell":"488 GTB","baujahr":2019,"km_stand":30000,"preis":220000,"farbe":null,"notizen":null}

Input: "Lamborghini Huracán LP 610-4, 2019, 18.500 km, Giallo Orion, 198.000€, Liftsystem, Kamera, keine Mängel"
Output: {"typ":"angebot","marke":"Lamborghini","modell":"Huracán LP 610-4","baujahr":2019,"km_stand":18500,"preis":198000,"farbe":"Giallo Orion","notizen":"Liftsystem, Rückfahrkamera, keine Mängel"}`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    typ:      { type: "STRING", enum: ["angebot", "gesuch"] },
    marke:    { type: "STRING", nullable: true },
    modell:   { type: "STRING", nullable: true },
    baujahr:  { type: "INTEGER", nullable: true },
    km_stand: { type: "INTEGER", nullable: true },
    preis:    { type: "INTEGER", nullable: true },
    farbe:    { type: "STRING", nullable: true },
    notizen:  { type: "STRING", nullable: true },
  },
  required: ["typ", "marke", "modell", "baujahr", "km_stand", "preis", "farbe", "notizen"],
};

type ParsedVehicle = {
  typ: string | null;
  marke: string | null;
  modell: string | null;
  baujahr: number | null;
  km_stand: number | null;
  preis: number | null;
  farbe: string | null;
  notizen: string | null;
};

type GeminiResponse = {
  candidates?: { content: { parts: { text: string }[] } }[];
  error?: { message: string };
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json() as { text: string };
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "AI Parse is not configured. Add GEMINI_API_KEY to .env.local.",
      data: {},
    }, { status: 200 });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    const geminiData = await geminiRes.json() as GeminiResponse;

    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error.message);
      const isQuota = geminiData.error.message?.includes("quota") || geminiData.error.message?.includes("429");
      const msg = isQuota
        ? "Gemini quota exceeded. Enable billing at console.cloud.google.com for your API key project."
        : `AI error: ${geminiData.error.message}`;
      return NextResponse.json({ error: msg, data: {} }, { status: 200 });
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: ParsedVehicle = {
      typ: null, marke: null, modell: null, baujahr: null,
      km_stand: null, preis: null, farbe: null, notizen: null,
    };
    try {
      parsed = { ...parsed, ...JSON.parse(content) };
    } catch {
      /* schema-enforced JSON should never fail, but keep fallback */
    }

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
      return isFinite(n) && n > 0 ? Math.round(n) : null;
    };

    const isMiles = /\bmiles?\b|\bmi\b/.test(text.toLowerCase());
    let km_stand = toNum(parsed.km_stand);
    if (isMiles && km_stand !== null) km_stand = Math.round(km_stand * 1.609);

    return NextResponse.json({
      success: true,
      data: {
        typ:     normalize(parsed.typ),
        marke:   normalize(parsed.marke),
        modell:  normalize(parsed.modell),
        baujahr: toNum(parsed.baujahr),
        km_stand,
        preis:   toNum(parsed.preis),
        farbe:   normalize(parsed.farbe),
        notizen: normalize(parsed.notizen),
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Parse error — please try again.", data: {} }, { status: 200 });
  }
}
