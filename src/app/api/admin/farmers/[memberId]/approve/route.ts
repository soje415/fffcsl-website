import { ensureSchema, hasConfirmedPayment, logAdminEvent, sql } from "@/lib/db";
import { smsRegistrationComplete } from "@/lib/notify";
import { MEMBER_ID_RE, badRequest, clientIp, crossOriginBlocked, notFound, readJson, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual verification for a farmer whose registry lookup can't succeed
 * (e.g. their name is spelled differently on the NIN). Requires a confirmed
 * payment and a written reason, and is recorded in the audit log.
 */
export async function POST(req: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!MEMBER_ID_RE.test(id)) return notFound("Farmer not found.");

  try {
    const body = await readJson(req, 1024);
    if (body.error) return body.error;
    const reason = typeof body.data.reason === "string" ? body.data.reason.trim() : "";
    if (reason.length < 5 || reason.length > 200) {
      return badRequest("Give a short reason (5 to 200 characters) for approving manually.");
    }

    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT first_name, phone, verification_status FROM farmers WHERE member_id = ${id}`;
    if (rows.length === 0) return notFound("Farmer not found.");
    const farmer = rows[0] as { first_name: string; phone: string; verification_status: string };

    if (farmer.verification_status === "verified") return badRequest("This farmer is already verified.");
    if (!(await hasConfirmedPayment(id))) {
      return Response.json({ success: false, error: "The ID card fee hasn't been paid yet." }, { status: 409 });
    }

    await db`
      UPDATE farmers SET
        verification_status = 'verified',
        verified_at = COALESCE(verified_at, now()),
        kyc_type = CASE WHEN kyc_type = '' THEN 'manual' ELSE kyc_type END
      WHERE member_id = ${id}
    `;
    await logAdminEvent("approve_manual", clientIp(req), `${id}: ${reason}`);
    smsRegistrationComplete(farmer.phone, farmer.first_name, id, "en");

    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError("admin-approve", err, "Could not approve this farmer.");
  }
}
