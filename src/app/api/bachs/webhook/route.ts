import { createHmac, timingSafeEqual } from "crypto";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import { ID_CARD_FEE_NAIRA } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 100_000;
const TOLERANCE_SECONDS = 300;

/** Bachs signs `{timestamp}.{raw body}` with HMAC-SHA256; the V2 header may hold several v1 values during rotation. */
function validSignature(raw: string, header: string, secret: string): boolean {
  const pairs = header.split(",").map((p) => p.trim().split("="));
  const t = pairs.find(([k]) => k === "t")?.[1];
  const timestamp = Number(t);
  if (!t || Number.isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest();
  return pairs
    .filter(([k]) => k === "v1")
    .some(([, sig]) => {
      const given = Buffer.from(sig ?? "", "hex");
      return given.length === expected.length && timingSafeEqual(expected, given);
    });
}

export async function POST(req: Request) {
  const secret = process.env.BACHS_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a secret anyone could forge "payment received".
    console.error("[bachs-webhook] BACHS_WEBHOOK_SECRET is not set; rejecting");
    return Response.json({ success: false, error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return Response.json({ success: false, error: "Payload too large" }, { status: 413 });

  const header = req.headers.get("x-bachs-signature-v2");
  if (!header) return Response.json({ success: false, error: "Missing signature" }, { status: 401 });
  if (!validSignature(raw, header, secret)) {
    return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Only a collected checkout counts, never the redirect. The event is signed,
  // but the amount is still compared with our own fee so a short payment can't pass.
  if (event.type === "collection.succeeded") {
    const checkoutId = typeof event.data?.checkout_id === "string" ? event.data.checkout_id : undefined;
    const amount = Number(event.data?.amount);
    const ok = event.data?.status === "SUCCEEDED" && event.data?.currency === "NGN" && amount >= ID_CARD_FEE_NAIRA;
    if (checkoutId && ok) {
      try {
        const payment = await getPayment(checkoutId);
        if (payment && payment.status !== "paid") await markPaymentPaid(checkoutId);
      } catch (err) {
        console.error("[bachs-webhook] could not process payment event", err instanceof Error ? err.message : "error");
        // Non-2xx so Bachs retries; the status poll also covers it.
        return Response.json({ success: false }, { status: 500 });
      }
    }
  }

  return Response.json({ success: true });
}
