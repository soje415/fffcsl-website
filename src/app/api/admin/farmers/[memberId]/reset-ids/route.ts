import { ensureSchema, logAdminEvent, sql } from "@/lib/db";
import { MEMBER_ID_RE, badRequest, clientIp, crossOriginBlocked, notFound, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clears the NIN/BVN a farmer registered with so they can enter the right
 * ones at verification (the number checked must otherwise match what they
 * registered with). Only for farmers who aren't verified yet.
 */
export async function POST(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!MEMBER_ID_RE.test(id)) return notFound("Farmer not found.");

  try {
    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT verification_status FROM farmers WHERE member_id = ${id}`;
    if (rows.length === 0) return notFound("Farmer not found.");
    if ((rows[0] as { verification_status: string }).verification_status === "verified") {
      return badRequest("A verified farmer's ID numbers can't be reset.");
    }

    await db`UPDATE farmers SET nin = '', bvn = '', verification_status = 'pending' WHERE member_id = ${id}`;
    await logAdminEvent("reset_ids", clientIp(req), id);

    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError("admin-reset-ids", err, "Could not reset the ID numbers.");
  }
}
