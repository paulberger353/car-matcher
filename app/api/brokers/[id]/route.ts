import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, telefon, email, firma, notizen } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    await db
      .prepare(
        `UPDATE brokers SET name = ?, telefon = ?, email = ?, firma = ?, notizen = ? 
         WHERE id = ?`
      )
      .bind(name, telefon || null, email || null, firma || null, notizen || null, id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update broker error:", error);
    return NextResponse.json(
      { error: "Failed to update broker" },
      { status: 500 }
    );
  }
}
