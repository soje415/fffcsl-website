import { createHmac, timingSafeEqual } from "crypto";
import { checkVirtualAccountPaid, getCheckoutStatus } from "@/lib/providers/hyparrow";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import { ensureSchema, sql } from "@/lib/db";
import { ID_CARD_FEE_KOBO } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 100_000;

export async function POST(req: Request) {
  const secret = process.env.HYPARROW_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a secret anyone could forge "payment received".
    console.error("[hyparrow-webhook] HYPARROW_WEBHOOK_SECRET is not set; rejecting");
    return Response.json({ success: false, error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return Response.json({ success: false, error: "Payload too large" }, { status: 413 });
  }

  const signature = req.headers.get("x-hyparrow-signature");
  if (!signature) {
    return Response.json({ success: false, error: "Missing signature" }, { status: 401 });
  }
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const customerId = typeof event.data?.customerId === "string" ? event.data.customerId : undefined;

  // A customer moved to a new virtual account: show payers the new number from
  // now on. The old one keeps crediting, and the customerId is unchanged, so
  // confirmation is unaffected.
  const newNumber = typeof event.data?.accountNumber === "string" ? event.data.accountNumber : "";
  if (event.event === "customer.account.migrated" && (customerId ?? (event.data?.id as string | undefined)) && newNumber) {
    const id = (customerId ?? event.data?.id) as string;
    try {
      await ensureSchema();
      const bank = typeof event.data?.bankName === "string" ? event.data.bankName : "";
      const name = typeof event.data?.accountName === "string" ? event.data.accountName : "";
      await sql()`
        UPDATE payments SET account_number = ${newNumber},
          bank_name = COALESCE(NULLIF(${bank}, ''), bank_name),
          account_name = COALESCE(NULLIF(${name}, ''), account_name)
        WHERE customer_id = ${id} AND status <> 'paid'`;
      await sql()`
        UPDATE farmers SET virtual_account_number = ${newNumber},
          virtual_account_bank = COALESCE(NULLIF(${bank}, ''), virtual_account_bank)
        WHERE virtual_account_customer_id = ${id}`;
    } catch (err) {
      console.error("[hyparrow-webhook] could not record migrated account", err instanceof Error ? err.message : "error");
      return Response.json({ success: false }, { status: 500 });
    }
    return Response.json({ success: true });
  }
  if (customerId && event.event === "customer.transaction.completed") {
    try {
      const payment = await getPayment(customerId);
      if (payment && payment.status !== "paid") {
        // The event only prompts a check. Whether it counts is decided by
        // re-asking Hyparrow against our own fee, so a wrong or short amount
        // in the event can never mark a member as paid.
        const confirmed = payment.account_number
          ? await checkVirtualAccountPaid(customerId, ID_CARD_FEE_KOBO)
          : await getCheckoutStatus(customerId);
        if (confirmed) await markPaymentPaid(customerId);
      }
    } catch (err) {
      console.error("[hyparrow-webhook] could not process payment event", err instanceof Error ? err.message : "error");
      // Non-2xx so Hyparrow retries; the status poll also covers it.
      return Response.json({ success: false }, { status: 500 });
    }
  }

  return Response.json({ success: true });
}
