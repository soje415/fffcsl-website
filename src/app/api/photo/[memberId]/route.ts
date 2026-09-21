import { ensureSchema, sql } from "@/lib/db";
import { MEMBER_ID_RE, clientIp, rateLimit } from "@/lib/security";
import { downloadPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISSING = () => new Response("Not found", { status: 404, headers: { "X-Content-Type-Options": "nosniff" } });

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!id || !MEMBER_ID_RE.test(id)) return MISSING();

  // A page can show a few dozen thumbnails at once (admin table), so this is
  // generous per IP but still stops bulk scraping of the photo store.
  const limited = await rateLimit("photo", clientIp(req), 300, 300);
  if (limited) return limited;

  try {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT photo FROM farmers WHERE member_id = ${id}`;
    const key = rows[0]?.photo as string | undefined;
    if (!key) return MISSING();

    const photo = await downloadPhoto(key);
    if (!photo) return MISSING();

    return new Response(new Uint8Array(photo.body), {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "private, max-age=3600",
        // Belt and braces: even if a non-image ever landed in the bucket, the
        // browser must not sniff or execute it.
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("[photo]", err instanceof Error ? err.message : "error");
    return new Response("Could not load photo", { status: 500 });
  }
}
