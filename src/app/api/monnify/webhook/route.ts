import { createHmac, timingSafeEqual } from "crypto";
import { checkReservedAccountPaid, getTransactionStatus } from "@/lib/providers/monnify";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import { ID_CARD_FEE_KOBO } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 100_000;

export async function POST(req: Request) {
  const secret = process.env.MONNIFY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a secret anyone could forge "payment received".
    console.error("[monnify-webhook] MONNIFY_WEBHOOK_SECRET is not set; rejecting");
    return Response.json({ success: false, error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return Response.json({ success: false, error: "Payload too large" }, { status: 413 });
  }

  // Monnify only signs webhook requests in production — sandbox notifications
  // carry no signature header at all, so sandbox confirmation relies on the
  // client-side status poll instead of this route.
  const signature = req.headers.get("monnify-signature");
  if (!signature) {
    return Response.json({ success: false, error: "Missing signature" }, { status: 401 });
  }
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    eventType?: string;
    eventData?: Record<string, unknown>;
    transactionReference?: string;
    paymentReference?: string;
    paymentStatus?: string;
    product?: { type?: string; reference?: string };
  } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Monnify wraps newer events as {eventType, eventData}; fall back to a flat
  // payload in case an older notification format is ever delivered.
  const data = event.eventData ?? (event as Record<string, unknown>);
  const paymentStatus = (data.paymentStatus as string | undefined) ?? event.paymentStatus;
  const transactionReference = (data.transactionReference as string | undefined) ?? event.transactionReference;
  const product = (data.product as { type?: string; reference?: string } | undefined) ?? event.product;

  if (paymentStatus === "PAID" || paymentStatus === "OVERPAID") {
    // A reserved-account credit is tracked by the account reference (what we
    // stored as customer_id when the account was created), not the
    // transaction reference of that one transfer.
    const customerId = product?.type === "RESERVED_ACCOUNT" ? product.reference : transactionReference;
    if (customerId) {
      try {
        const payment = await getPayment(customerId);
        if (payment && payment.status !== "paid") {
          // The event only prompts a check. Whether it counts is decided by
          // re-asking Monnify against our own fee, so a wrong or short amount
          // in the event can never mark a member as paid.
          const confirmed = payment.account_number
            ? await checkReservedAccountPaid(customerId, ID_CARD_FEE_KOBO)
            : await getTransactionStatus(customerId);
          if (confirmed) await markPaymentPaid(customerId);
        }
      } catch (err) {
        console.error("[monnify-webhook] could not process payment event", err instanceof Error ? err.message : "error");
        return Response.json({ success: false }, { status: 500 });
      }
    }
  }

  return Response.json({ success: true });
}
