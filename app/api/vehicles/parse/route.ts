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
    const response = await ai.run("@cf/meta/llama-3.2-1b-instruct", {
      messages: [
        {
          role: "system",
          content:
            'Extrahiere Fahrzeugdaten aus dem Text und antworte NUR mit reinem JSON ohne Markdown oder Code-Blöcke. Felder: marke, modell, baujahr, km_stand, preis, farbe, typ, notizen. "typ" ist "angebot" oder "gesuch". Zahlen als Zahlen. Unbekannte Felder als null.',
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
