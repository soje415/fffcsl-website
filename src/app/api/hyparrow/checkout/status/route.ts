import { getCheckoutStatus } from "@/lib/providers/hyparrow";
import { parseLang } from "@/lib/notify";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import {
  badRequest,
  crossOriginBlocked,
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

    const limited = await rateLimit("checkout-status", invoiceId, 40, 60);
    if (limited) return limited;

    // Only invoices we created ourselves; the invoice amount was fixed server-side.
    const payment = await getPayment(invoiceId);
    if (!payment) return Response.json({ success: true, paid: false });
    if (payment.status === "paid") return Response.json({ success: true, paid: true });

    const paid = await getCheckoutStatus(invoiceId);
    if (paid) await markPaymentPaid(invoiceId, parseLang(body.data.lang));

    return Response.json({ success: true, paid });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("checkout-status", err);
    return serverError("checkout-status", err, "Could not confirm payment.");
  }
}
