import { createInvoice, type HyparrowError } from "@/lib/providers/hyparrow";
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
    const body = (await req.json()) as {
      memberId?: string;
      title?: string;
      amount?: number;
      customerName?: string;
      customerEmail?: string;
    };

    const memberId = String(body.memberId ?? "").trim();

    if (!memberId || !body.amount || body.amount <= 0) {
      return Response.json(
        { success: false, code: "VALIDATION_ERROR", error: "memberId and amount are required." },
        { status: 400 }
      );
    }

    const invoice = await createInvoice({
      title: body.title || "FFFCSL ID Card Fee",
      amountNaira: body.amount,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
    });

    // Persist the pending payment, keyed by invoice id, so the status check
    // and the KYC payment gate have a durable record for USSD/OPay too.
    try {
      await ensureSchema();
      await sql()`
        INSERT INTO payments (customer_id, member_id, amount_kobo, status)
        VALUES (${invoice.id}, ${memberId}, ${Math.round(body.amount * 100)}, 'pending')
        ON CONFLICT (customer_id) DO UPDATE SET member_id = EXCLUDED.member_id
      `;
    } catch {
      // Payment record is best-effort; the invoice itself is already created.
    }

    return Response.json({ success: true, invoiceId: invoice.id });
  } catch (err) {
    return errorResponse(err);
  }
}
