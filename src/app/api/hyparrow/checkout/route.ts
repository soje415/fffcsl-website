import { createInvoice } from "@/lib/providers/hyparrow";
import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import { getPayment } from "@/lib/payments";
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

    const ipLimited = await rateLimit("invoice-ip", clientIp(req), 20, 3600);
    if (ipLimited) return ipLimited;
    const memberLimited = await rateLimit("invoice-member", memberId, 6, 3600);
    if (memberLimited) return memberLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT first_name, last_name, email, checkout_invoice_id FROM farmers WHERE member_id = ${memberId}
    `;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as { first_name: string; last_name: string; email: string; checkout_invoice_id: string };

    if (await hasConfirmedPayment(memberId)) {
      return Response.json({ success: false, error: "This membership fee has already been paid." }, { status: 409 });
    }

    // Reuse the open invoice rather than creating a new one on every retry.
    if (farmer.checkout_invoice_id) {
      const open = await getPayment(farmer.checkout_invoice_id);
      if (open && open.member_id === memberId && open.status !== "paid" && open.amount_kobo === ID_CARD_FEE_KOBO) {
        return Response.json({ success: true, invoiceId: farmer.checkout_invoice_id });
      }
    }

    const invoice = await createInvoice({
      title: "FFFCSL ID Card Fee",
      amountNaira: ID_CARD_FEE_NAIRA,
      customerName: `${farmer.first_name} ${farmer.last_name}`.trim(),
      customerEmail: farmer.email || undefined,
    });

    await db`
      INSERT INTO payments (customer_id, member_id, amount_kobo, status)
      VALUES (${invoice.id}, ${memberId}, ${ID_CARD_FEE_KOBO}, 'pending')
      ON CONFLICT (customer_id) DO NOTHING
    `;
    await db`UPDATE farmers SET checkout_invoice_id = ${invoice.id} WHERE member_id = ${memberId}`;

    return Response.json({ success: true, invoiceId: invoice.id });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("checkout", err);
    return serverError("checkout", err, "Could not start checkout. Please try again.");
  }
}
