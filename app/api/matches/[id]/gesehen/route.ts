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

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    await db
      .prepare(`UPDATE matches SET gesehen = 1 WHERE id = ?`)
      .bind(id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update match error:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
