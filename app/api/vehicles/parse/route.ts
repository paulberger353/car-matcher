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
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Kein API Key konfiguriert" }, { status: 200 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extrahiere Fahrzeugdaten aus dem folgenden Text und antworte NUR mit reinem JSON ohne Markdown-Formatierung oder Code-Blöcke. Das JSON soll folgende Felder enthalten: marke, modell, baujahr, km_stand, preis, farbe, typ, notizen. Das Feld "typ" ist entweder "angebot" oder "gesuch". Zahlen als Zahlen, nicht als Strings. Felder die nicht erkennbar sind als null.\n\nText: ${text}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "KI-API Fehler", data: {} }, { status: 200 });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed = {};
    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Parse Fehler", data: {} }, { status: 200 });
  }
}
