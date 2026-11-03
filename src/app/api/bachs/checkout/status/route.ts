import { getCheckoutPaid } from "@/lib/providers/bachs";
import { parseLang } from "@/lib/notify";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import { badRequest, crossOriginBlocked, providerError, rateLimit, readJson, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  try {
    const body = await readJson(req, 2048);
    if (body.error) return body.error;

    const checkoutId = String(body.data.transactionReference ?? "").trim();
    if (!checkoutId || checkoutId.length > 100) return badRequest("transactionReference is required.");

    const limited = await rateLimit("bachs-checkout-status", checkoutId, 40, 60);
    if (limited) return limited;

    // Only sessions we created ourselves; the amount was fixed server-side.
    const payment = await getPayment(checkoutId);
    if (!payment) return Response.json({ success: true, paid: false });
    if (payment.status === "paid") return Response.json({ success: true, paid: true });

    const paid = await getCheckoutPaid(checkoutId);
    if (paid) await markPaymentPaid(checkoutId, parseLang(body.data.lang));

    return Response.json({ success: true, paid });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("bachs-checkout-status", err);
    return serverError("bachs-checkout-status", err, "Could not confirm payment.");
  }
}
