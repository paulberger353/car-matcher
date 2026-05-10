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
  const apiKey = env.GROQ_API_KEY;

  // Fallback wenn kein API Key
  if (!apiKey || apiKey === "placeholder" || apiKey === "") {
    return NextResponse.json(
      { error: "Kein API Key konfiguriert", data: {} },
      { status: 200 }
    );
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Extrahiere Fahrzeugdaten aus dem Text und antworte NUR mit JSON ohne Markdown: {marke, modell, baujahr, km_stand, preis, farbe, typ, notizen}. typ ist entweder angebot oder gesuch.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json(
        { error: "Groq API Fehler", data: {} },
        { status: 200 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // If JSON parsing fails, return empty
      parsed = {};
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Parse Fehler", data: {} },
      { status: 200 }
    );
  }
}
