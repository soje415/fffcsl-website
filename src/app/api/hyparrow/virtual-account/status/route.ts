import { checkVirtualAccountPaid, type HyparrowError } from "@/lib/providers/hyparrow";
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
      error: e.message ?? "Unexpected payment error",
    },
    { status }
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { customerId?: string; amountKobo?: number };
    if (!body.customerId || typeof body.amountKobo !== "number") {
      return Response.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          error: "customerId and amountKobo are required.",
        },
        { status: 400 }
      );
    }

    // 1. Check our own ledger first (webhook is the authority).
    try {
      await ensureSchema();
      const rows = await sql()`SELECT status FROM payments WHERE customer_id = ${body.customerId}`;
      if (rows.length > 0 && rows[0].status === "paid") {
        return Response.json({ success: true, paid: true });
      }
    } catch {
      // fall through to the direct Hyparrow check below
    }

    // 2. Fallback: query Hyparrow directly, and persist if paid.
    const paid = await checkVirtualAccountPaid(body.customerId, body.amountKobo);
    if (paid) {
      try {
        await ensureSchema();
        await sql()`
          UPDATE payments
          SET status = 'paid', paid_at = COALESCE(paid_at, now())
          WHERE customer_id = ${body.customerId}
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
