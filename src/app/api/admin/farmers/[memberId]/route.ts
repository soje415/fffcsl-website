import { ensureSchema, sql } from "@/lib/db";
import { MEMBER_ID_RE, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!id || !MEMBER_ID_RE.test(id)) {
    return Response.json({ success: false, error: "Farmer not found." }, { status: 404 });
  }

  try {
    await ensureSchema();
    const db = sql();

    const rows = await db`SELECT * FROM farmers WHERE member_id = ${id}`;
    if (rows.length === 0) {
      return Response.json({ success: false, error: "Farmer not found." }, { status: 404 });
    }

    const cropRows = await db`SELECT crop FROM farmer_crops WHERE member_id = ${id} ORDER BY crop`;
    const paymentRows = await db`
      SELECT customer_id, amount_kobo, status, account_number, bank_name, paid_at, created_at
      FROM payments WHERE member_id = ${id} ORDER BY created_at DESC
    `;

    return Response.json(
      {
        success: true,
        farmer: rows[0],
        crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
        payments: paymentRows,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return serverError("admin-farmer", err, "Could not load this farmer.");
  }
}
