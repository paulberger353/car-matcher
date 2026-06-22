import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const SYSTEM_PROMPT = `You are a vehicle data extraction expert. Extract structured vehicle data from the input text and respond ONLY with a valid JSON object — no markdown, no explanation, no code blocks.

FIELD RULES:

typ — "angebot" (listing / for sale) or "gesuch" (wanted / looking to buy).
  Angebot: biete, verkaufe, zu verkaufen, for sale, selling, sell, offering, offer, angebot, zu haben.
  Gesuch: suche, gesucht, wanted, looking for, searching, kaufe, buying, looking to buy, interested in.
  Default when unclear: "angebot".

marke — Manufacturer brand. Standardise and infer from model when brand is omitted:
  "Mercedes" / "Merc" → "Mercedes-Benz"; "VW" / "Volks" → "Volkswagen"; "Lambo" → "Lamborghini"; "Alfa" → "Alfa Romeo".
  Model-only inference: M2/M3/M4/M5/M8/X3M/X5M → "BMW"; RS3/RS4/RS5/RS6/RS7/TT/R8/e-tron → "Audi"; GT3/GT4/Taycan/Macan/Cayenne → "Porsche"; AMG GT → "Mercedes-Benz".
  null if brand cannot be determined.

modell — Full model name including trim/variant. Expand: "Comp" → "Competition", "4M" → "4MATIC+". null if not found.

baujahr — Year as integer.
  "Bj. 22" / "22er" / "'22" → 2022; "2021/22" → 2022; "EZ 2021" / "ab 2021" → 2021.
  Range "2018–2020" → midpoint 2019. null if not mentioned.

km_stand — Mileage as integer.
  "78tkm" → 78000; "78.000 km" → 78000; "98k" → 98000; "15.2tkm" → 15200.
  Miles: output the EXACT number written in the text, do NOT convert to km. "32,000 miles" → 32000.
  For gesuch: maximum acceptable mileage. null if not mentioned.

preis — Price in EUR as integer.
  "84.900€" → 84900; "85k" → 85000; "VB 85.000" / "ono" / "OBO" / "neg." → include the price as-is.
  "Preis auf Anfrage" / "PA" / "on request" / "price on application" → null.
  Ranges: angebot → lower bound; gesuch → upper bound.
  Currency: USD × 0.92, GBP × 1.17, CHF × 0.97. Round to nearest integer. null if not mentioned.

farbe — Single colour, preserve brand colour names ("Frozen Black Metallic", "Giallo Orion", "Corris Grey").
  Expand: "sw" → "Schwarz"; "ws" → "Weiß"; "si" → "Silber"; "bl" → "Blau"; "gr" → "Grau"; "rt" → "Rot".
  null if not mentioned.

notizen — Only extras not in other fields: equipment, condition, service history, number of owners.
  Expand abbreviations: "SH lückenlos" / "SHlü" / "SF" → "Scheckheft lückenlos"; "SH" → "Scheckheft vorhanden"; "1. Hd." / "1HD" / "1VB" → "1. Hand"; "NR" / "NSL" → "Nichtraucher"; "UF" / "unfallfrei" → "unfallfrei"; "HU neu" / "TÜV neu" → "HU neu"; "Pano" → "Panoramadach"; "Standhzg." → "Standheizung".
  Do NOT include: make, model, year, mileage, price, colour, phone numbers, email addresses, names.
  null if nothing extra.

EXAMPLES:

Input: "Biete BMW M3 Competition, Bj. 2022, 15.2tkm, Frozen Black Met., 84,9k VB, Carbon-Paket, unfallfrei, 1. Hd., SH lückenlos"
Output: {"typ":"angebot","marke":"BMW","modell":"M3 Competition","baujahr":2022,"km_stand":15200,"preis":84900,"farbe":"Frozen Black Metallic","notizen":"Carbon-Paket, unfallfrei, 1. Hand, Scheckheft lückenlos"}

Input: "Suche Porsche 911 GT3 (992), max Bj. 2022, max 15.000 km, Budget bis 195.000€"
Output: {"typ":"gesuch","marke":"Porsche","modell":"911 GT3","baujahr":2022,"km_stand":15000,"preis":195000,"farbe":null,"notizen":null}

Input: "Mercedes S63 AMG 4MATIC+ 2021, 22.400km, Obsidian Black Metallic, 148.500€, Burmester 3D, Pano, HUD, 1 Vorbesitzer"
Output: {"typ":"angebot","marke":"Mercedes-Benz","modell":"S63 AMG 4MATIC+","baujahr":2021,"km_stand":22400,"preis":148500,"farbe":"Obsidian Black Metallic","notizen":"Burmester 3D Surround, Panoramadach, HUD, 1 Vorbesitzer"}

Input: "Hallo, verkaufe meinen Lambo Huracan LP610 Bj 19, Giallo Orion, 18.500km, Liftsystem, 198k€. Tel: +49 151 12345678"
Output: {"typ":"angebot","marke":"Lamborghini","modell":"Huracán LP 610-4","baujahr":2019,"km_stand":18500,"preis":198000,"farbe":"Giallo Orion","notizen":"Liftsystem"}

Input: "Selling my 2019 Range Rover Sport SVR, 32,000 miles, Corris Grey, £74,500 ono. Full dealer service history, 22-inch alloys, panoramic roof."
Output: {"typ":"angebot","marke":"Land Rover","modell":"Range Rover Sport SVR","baujahr":2019,"km_stand":32000,"preis":87165,"farbe":"Corris Grey","notizen":"Full dealer service history, 22-inch alloys, panoramic roof"}

Input: "M5 Comp 21er 8tkm sw 105k VB 1HD NR SHlü"
Output: {"typ":"angebot","marke":"BMW","modell":"M5 Competition","baujahr":2021,"km_stand":8000,"preis":105000,"farbe":"Schwarz","notizen":"1. Hand, Nichtraucher, Scheckheft lückenlos"}`;

type CFAIResponse = {
  result?: { response: string };
  success?: boolean;
  errors?: { message: string }[];
};

type ParsedVehicle = {
  typ: string | null; marke: string | null; modell: string | null;
  baujahr: number | null; km_stand: number | null; preis: number | null;
  farbe: string | null; notizen: string | null;
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

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const aiToken   = process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !aiToken) {
    return NextResponse.json({
      error: "AI Parse is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_TOKEN to .env.local.",
      data: {},
    }, { status: 200 });
  }

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiToken}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
            { role: "assistant", content: '{"' },
          ],
          max_tokens: 512,
        }),
      }
    );

    const cfData = await cfRes.json() as CFAIResponse;

    if (!cfData.success || cfData.errors?.length) {
      const msg = cfData.errors?.[0]?.message ?? "Unknown error";
      console.error("Cloudflare AI error:", msg);
      return NextResponse.json({ error: `AI error: ${msg}`, data: {} }, { status: 200 });
    }

    const raw = cfData.result?.response;
    const rawContent = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");

    const tryParse = (s: string): ParsedVehicle | null => {
      try {
        const v = JSON.parse(s);
        return v && typeof v === "object" && !Array.isArray(v) ? v as ParsedVehicle : null;
      } catch { return null; }
    };

    const extracted =
      tryParse('{"' + rawContent) ??
      tryParse(rawContent.trim()) ??
      tryParse(rawContent.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim()) ??
      (() => { const m = rawContent.match(/\{[^]*\}/); return m ? tryParse(m[0]) : null; })();

    const parsed: ParsedVehicle = {
      typ: null, marke: null, modell: null, baujahr: null,
      km_stand: null, preis: null, farbe: null, notizen: null,
      ...(extracted ?? {}),
    };

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

    const isMiles = /\bmeilen\b|\bmiles?\b|\bmi\b/i.test(text);
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
