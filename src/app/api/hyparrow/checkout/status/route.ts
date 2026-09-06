import { getCheckoutStatus, type HyparrowError } from "@/lib/providers/hyparrow";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(err: unknown) {
  const e = err as HyparrowError;
  const status = e.status ?? 500;
  return Response.json(
    {
      success: false,
      code: e.code ?? "INTERNAL_ERROR",
      error: e.message ?? "Unexpected checkout error",
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { invoiceId?: string };
    if (!body.invoiceId) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "invoiceId is required." },
        { status: 400 }
      );
    }

    // 1. Check our own ledger first (webhook, if wired for checkout, would be authoritative).
    try {
      await ensureSchema();
      const rows = await sql()`SELECT status FROM payments WHERE customer_id = ${body.invoiceId}`;
      if (rows.length > 0 && rows[0].status === "paid") {
        return Response.json({ success: true, paid: true });
      }
    } catch {
      // fall through to the direct Hyparrow check below
    }

    // 2. Fallback: query Hyparrow directly, and persist if paid.
    const paid = await getCheckoutStatus(body.invoiceId);
    if (paid) {
      try {
        await ensureSchema();
        await sql()`
          UPDATE payments
          SET status = 'paid', paid_at = COALESCE(paid_at, now())
          WHERE customer_id = ${body.invoiceId}
        `;
      } catch {
        // ignore persistence errors here
      }
    }

    return Response.json({ success: true, paid });
  } catch (err) {
    return errorResponse(err);
  }
}
