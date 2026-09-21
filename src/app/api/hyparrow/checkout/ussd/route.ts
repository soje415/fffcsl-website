import { generateUssdCode } from "@/lib/providers/hyparrow";
import { ensureSchema, sql } from "@/lib/db";
import { getPayment } from "@/lib/payments";
import { USSD_BANKS } from "@/lib/ussd-banks";
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
    const bankCode = String(body.data.bankCode ?? "").trim();
    if (!invoiceId || invoiceId.length > 100) return badRequest("invoiceId is required.");
    if (!USSD_BANKS.some((b) => b.code === bankCode)) return badRequest("Select a valid bank.");

    const limited = await rateLimit("ussd", clientIp(req), 30, 3600);
    if (limited) return limited;

    const payment = await getPayment(invoiceId);
    if (!payment || !payment.member_id || payment.status === "paid") return notFound("Invoice not found.");

    const { ussdCode } = await generateUssdCode(invoiceId, bankCode);

    await ensureSchema();
    await sql()`
      UPDATE farmers
      SET payment_method = 'ussd', ussd_code = ${ussdCode}, ussd_bank_code = ${bankCode}
      WHERE member_id = ${payment.member_id}
    `;

    return Response.json({ success: true, ussdCode });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("ussd", err);
    return serverError("ussd", err, "Could not generate a USSD code.");
  }
}
