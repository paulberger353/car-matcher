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

  const { text } = await req.json() as { text: string };

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const ai = env.AI;

  if (!ai) {
    return NextResponse.json({ error: "AI not available", data: {} }, { status: 200 });
  }

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `Extract vehicle data from text and respond ONLY with raw JSON — no markdown, no explanations, no code blocks.

JSON fields: marke, modell, baujahr, km_stand, preis, farbe, typ, notizen

Rules:
- "typ": "gesuch" if the text is a search request (words like "suche", "gesucht", "looking for", "wanted", "searching"). Otherwise "angebot".
- Numbers always as number (not string). Examples: "98k" = 98000, "78tkm" = 78000, "28.000€" = 28000, "VB 18500" = 18500.
- km_stand: Always enter the stated mileage value, even with "max", "under", "up to". Example: "max 50.000 km" → 50000, "under 20000 miles" → 20000 (note the unit). If the unit is "miles" or "mi", keep the number as-is — conversion happens separately.
- preis: Always in EUR. If USD, multiply by 0.92 and round to integer. If GBP, multiply by 1.17.
- baujahr: Only set if explicitly stated. Year ranges like "2017-2020" → average (2018). "2020 or newer" → 2020. Not mentioned → null.
- farbe: Only ONE color. Include brand color names in full (e.g. "Giallo Orion", "Rosso Corsa"). If multiple colors, use the first.
- notizen: ONLY information that does not fit other fields: equipment, condition, extras. Do NOT repeat make, model, year, mileage, price, color, type.
- Unknown fields: null.`,
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

    const textLower = text.toLowerCase();
    const isMiles = /\bmiles?\b|\bmi\b/.test(textLower);

    let km_stand = toNum(parsed.km_stand);
    if (isMiles && km_stand !== null) {
      km_stand = Math.round(km_stand * 1.609);
    }

    const safe = {
      typ: normalize(parsed.typ),
      marke: normalize(parsed.marke),
      modell: normalize(parsed.modell),
      baujahr: toNum(parsed.baujahr),
      km_stand,
      preis: toNum(parsed.preis),
      farbe: normalize(parsed.farbe),
      notizen: normalize(parsed.notizen),
    };

    return NextResponse.json({ success: true, data: safe });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Parse error", data: {} }, { status: 200 });
  }
}
