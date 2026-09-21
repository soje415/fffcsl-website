import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();
  if (!id) {
    return Response.json({ success: false, error: "Member ID is required." }, { status: 400 });
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

    return Response.json({
      success: true,
      farmer: rows[0],
      crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
      payments: paymentRows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load this farmer.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
