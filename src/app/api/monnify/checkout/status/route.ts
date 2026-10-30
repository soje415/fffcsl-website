import { getTransactionStatus } from "@/lib/providers/monnify";
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

    const transactionReference = String(body.data.transactionReference ?? "").trim();
    if (!transactionReference || transactionReference.length > 100) {
      return badRequest("transactionReference is required.");
    }

    const limited = await rateLimit("mn-checkout-status", transactionReference, 40, 60);
    if (limited) return limited;

    // Only sessions we created ourselves; the amount was fixed server-side.
    const payment = await getPayment(transactionReference);
    if (!payment) return Response.json({ success: true, paid: false });
    if (payment.status === "paid") return Response.json({ success: true, paid: true });

    const paid = await getTransactionStatus(transactionReference);
    if (paid) await markPaymentPaid(transactionReference, parseLang(body.data.lang));

    return Response.json({ success: true, paid });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("mn-checkout-status", err);
    return serverError("mn-checkout-status", err, "Could not confirm payment.");
  }
}
