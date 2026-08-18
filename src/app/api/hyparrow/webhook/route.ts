import { createHmac, timingSafeEqual } from "crypto";
import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const customerId = event.data?.customerId as string | undefined;
  if (customerId && event.event === "customer.transaction.completed") {
    try {
      await ensureSchema();
      await sql()`
        UPDATE payments
        SET status = 'paid', paid_at = COALESCE(paid_at, now())
        WHERE customer_id = ${customerId}
      `;
    } catch (err) {
      console.error("[hyparrow-webhook] failed to mark paid", err);
    }
  }

  return Response.json({ success: true });
}
