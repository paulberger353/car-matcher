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
  const { status } = await req.json();

  if (!["vermittelt", "geplatzt"].includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    await db
      .prepare(`UPDATE matches SET status = ?, status_at = datetime('now'), gesehen = 1 WHERE id = ?`)
      .bind(status, id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update match status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
