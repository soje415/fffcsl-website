import { createCheckout } from "@/lib/providers/bachs";
import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import { SITE_URL } from "@/lib/sms-templates";
import {
  ID_CARD_FEE_KOBO,
  ID_CARD_FEE_NAIRA,
  MEMBER_ID_RE,
  clientIp,
  crossOriginBlocked,
  notFound,
  providerError,
  rateLimit,
  readJson,
  serverError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  try {
    const body = await readJson(req, 4096);
    if (body.error) return body.error;

    // Token only: the amount and customer details come from our records.
    const memberId = String(body.data.memberId ?? "").trim();
    if (!MEMBER_ID_RE.test(memberId)) return notFound("We couldn't find that token.");

    const ipLimited = await rateLimit("bachs-checkout-ip", clientIp(req), 20, 3600);
    if (ipLimited) return ipLimited;
    const memberLimited = await rateLimit("bachs-checkout-member", memberId, 6, 3600);
    if (memberLimited) return memberLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`SELECT first_name, last_name, email, phone FROM farmers WHERE member_id = ${memberId}`;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as { first_name: string; last_name: string; email: string; phone: string };

    if (await hasConfirmedPayment(memberId)) {
      return Response.json({ success: false, error: "This membership fee has already been paid." }, { status: 409 });
    }

    const serial = memberId.split("/").pop() ?? memberId;
    // Bachs refuses localhost return URLs, so local testing falls back to the public site.
    const requested = req.headers.get("origin");
    const origin = requested && !/localhost|127\.0\.0\.1/.test(requested) ? requested : SITE_URL;
    const returnUrl = `${origin}/membership/id-card`;

    // A fresh session per click: they are cheap, and a stored checkout_url
    // couldn't be handed back later anyway.
    const session = await createCheckout({
      amountNaira: ID_CARD_FEE_NAIRA,
      customerName: `${farmer.first_name} ${farmer.last_name}`.trim() || "FFFCSL Member",
      customerEmail: farmer.email || `member-${serial}@fadamacooperative.com`,
      customerPhone: farmer.phone,
      memberId,
      successUrl: returnUrl,
      cancelUrl: returnUrl,
    });

    await db`
      INSERT INTO payments (customer_id, member_id, amount_kobo, status, provider)
      VALUES (${session.checkoutId}, ${memberId}, ${ID_CARD_FEE_KOBO}, 'pending', 'bachs')
      ON CONFLICT (customer_id) DO NOTHING
    `;
    await db`UPDATE farmers SET checkout_invoice_id = ${session.checkoutId}, payment_method = 'online' WHERE member_id = ${memberId}`;

    return Response.json({ success: true, transactionReference: session.checkoutId, checkoutUrl: session.checkoutUrl });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("bachs-checkout", err);
    return serverError("bachs-checkout", err, "Could not start checkout. Please try again.");
  }
}
