import { initOpayCheckout } from "@/lib/providers/hyparrow";
import { ensureSchema, sql } from "@/lib/db";
import { getPayment } from "@/lib/payments";
import {
  badRequest,
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
    const body = await readJson(req, 2048);
    if (body.error) return body.error;

    const invoiceId = String(body.data.invoiceId ?? "").trim();
    if (!invoiceId || invoiceId.length > 100) return badRequest("invoiceId is required.");

    const limited = await rateLimit("opay", clientIp(req), 20, 3600);
    if (limited) return limited;

    // Only invoices we issued, and only while still unpaid.
    const payment = await getPayment(invoiceId);
    if (!payment || !payment.member_id || payment.status === "paid") return notFound("Invoice not found.");

    const { redirectUrl } = await initOpayCheckout(invoiceId);

    await ensureSchema();
    await sql()`UPDATE farmers SET payment_method = 'opay' WHERE member_id = ${payment.member_id}`;

    return Response.json({ success: true, redirectUrl });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("opay", err);
    return serverError("opay", err, "Could not start OPay checkout.");
  }
}
