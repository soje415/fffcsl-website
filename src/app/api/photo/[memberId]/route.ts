import { ensureSchema, sql } from "@/lib/db";
import { downloadPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!id) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT photo FROM farmers WHERE member_id = ${id}`;
    const key = rows[0]?.photo as string | undefined;
    if (!key) {
      return new Response("Not found", { status: 404 });
    }

    const photo = await downloadPhoto(key);
    if (!photo) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(photo.body), {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Could not load photo", { status: 500 });
  }
}
