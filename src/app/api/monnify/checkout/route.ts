import { initCheckout } from "@/lib/providers/monnify";
import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
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

    const ipLimited = await rateLimit("mn-checkout-ip", clientIp(req), 20, 3600);
    if (ipLimited) return ipLimited;
    const memberLimited = await rateLimit("mn-checkout-member", memberId, 6, 3600);
    if (memberLimited) return memberLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT first_name, last_name, email FROM farmers WHERE member_id = ${memberId}
    `;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as { first_name: string; last_name: string; email: string };

    if (await hasConfirmedPayment(memberId)) {
      return Response.json({ success: false, error: "This membership fee has already been paid." }, { status: 409 });
    }

    // Checkout links expire in 40 minutes and are cheap to recreate, so
    // every click starts a fresh session rather than reusing a stored one
    // (whose checkoutUrl we'd have no way to hand back later anyway).
    const serial = memberId.split("/").pop() ?? memberId;
    const email = farmer.email || `member-${serial}@fadamacooperative.com`;
    const customerName = `${farmer.first_name} ${farmer.last_name}`.trim() || "FFFCSL Member";
    const origin = req.headers.get("origin") ?? "https://fadamacooperative.com";

    const session = await initCheckout({
      amountNaira: ID_CARD_FEE_NAIRA,
      paymentReference: `${memberId.replace(/\//g, "-")}-${Date.now()}`,
      customerName,
      customerEmail: email,
      description: "FFFCSL ID Card Fee",
      // No query string: Monnify appends its own params with a bare "?"
      // rather than "&", which would corrupt a "?token=" already here. The
      // wizard doesn't need the token in the URL anyway — it resumes from
      // the draft already saved in localStorage.
      redirectUrl: `${origin}/membership/id-card`,
    });

    await db`
      INSERT INTO payments (customer_id, member_id, amount_kobo, status, provider)
      VALUES (${session.transactionReference}, ${memberId}, ${ID_CARD_FEE_KOBO}, 'pending', 'monnify')
      ON CONFLICT (customer_id) DO NOTHING
    `;
    await db`UPDATE farmers SET monnify_transaction_ref = ${session.transactionReference} WHERE member_id = ${memberId}`;

    return Response.json({
      success: true,
      transactionReference: session.transactionReference,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("mn-checkout", err);
    return serverError("mn-checkout", err, "Could not start checkout. Please try again.");
  }
}
