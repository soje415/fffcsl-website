import { ensureSchema, sql } from "@/lib/db";
import { MEMBER_ID_RE, badRequest, clientIp, notFound, rateLimit, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_FOUND = "No FFFCSL member found with that ID.";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();

  if (!id) return badRequest("Member ID is required.");
  if (!MEMBER_ID_RE.test(id)) return notFound(NOT_FOUND);

  const limited = await rateLimit("verify", clientIp(req), 60, 300);
  if (limited) return limited;

  try {
    await ensureSchema();
    const db = sql();

    // Only members who completed KYC count. A pre-registration token alone
    // (anyone can create one) must never read as a "verified member".
    const rows = await db`
      SELECT member_id, first_name, last_name, state, lga, photo,
             COALESCE(verified_at, created_at) AS member_since
      FROM farmers
      WHERE member_id = ${id} AND verification_status = 'verified'
    `;

    if (rows.length === 0) return notFound(NOT_FOUND);

    const row = rows[0] as Record<string, unknown>;
    const cropRows = await db`
      SELECT crop FROM farmer_crops WHERE member_id = ${id} ORDER BY crop
    `;

    const since = new Date(row.member_since as string);
    const validTill = new Date(since);
    validTill.setFullYear(validTill.getFullYear() + 2);

    return Response.json({
      success: true,
      member: {
        memberId: row.member_id as string,
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        state: row.state as string,
        lga: row.lga as string,
        crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
        hasPhoto: Boolean(row.photo),
        memberSince: since.getFullYear(),
        validTill: validTill.toISOString(),
      },
    });
  } catch (err) {
    return serverError("verify-member", err, "Could not verify this member.");
  }
}
