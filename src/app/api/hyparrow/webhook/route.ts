import { createHmac, timingSafeEqual } from "crypto";
import { checkVirtualAccountPaid, getCheckoutStatus } from "@/lib/providers/hyparrow";
import { getPayment, markPaymentPaid } from "@/lib/payments";
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
