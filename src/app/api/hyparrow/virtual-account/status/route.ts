import { checkVirtualAccountPaid } from "@/lib/providers/hyparrow";
import { parseLang } from "@/lib/notify";
import { getPayment, markPaymentPaid } from "@/lib/payments";
import {
  ID_CARD_FEE_KOBO,
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

    const customerId = String(body.data.customerId ?? "").trim();
    if (!customerId || customerId.length > 100) return badRequest("customerId is required.");

    // The page polls every few seconds; this only stops runaway loops.
    const limited = await rateLimit("va-status", customerId, 40, 60);
    if (limited) return limited;

    const payment = await getPayment(customerId);
    if (!payment || !payment.account_number) return Response.json({ success: true, paid: false });
    if (payment.status === "paid") return Response.json({ success: true, paid: true });

    // The amount is ours, never the client's: an underpayment must not count.
    const paid = await checkVirtualAccountPaid(customerId, ID_CARD_FEE_KOBO);
    if (paid) await markPaymentPaid(customerId, parseLang(body.data.lang));

    return Response.json({ success: true, paid });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("va-status", err);
    return serverError("va-status", err, "Could not confirm payment.");
  }
}
