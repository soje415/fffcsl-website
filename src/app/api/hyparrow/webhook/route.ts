import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED_EVENTS = [
  "customer.transaction.completed",
  "subscription.payment.completed",
  "checkout.payment.completed",
];

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.HYPARROW_WEBHOOK_SECRET;
  const signature = req.headers.get("x-hyparrow-signature");

  if (secret) {
    if (!signature) {
      return Response.json({ success: false, error: "Missing signature" }, { status: 401 });
    }
    const expected = createHmac("sha512", secret).update(raw).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: { event?: string; data?: Record<string, unknown> } = {};
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Acknowledge payment events. Without a persistent datastore there is no
  // server-side record to update, so confirmation is driven client-side by
  // polling /api/hyparrow/virtual-account/status. When a database is added,
  // mark the customerId (event.data.customerId) as paid here.
  if (HANDLED_EVENTS.includes(event.event ?? "")) {
    console.log("[hyparrow-webhook]", event.event, event.data?.customerId);
  }

  return Response.json({ success: true });
}
