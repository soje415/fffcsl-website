import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import {
  MEMBER_ID_RE,
  clientIp,
  notFound,
  badRequest,
  rateLimit,
  serverError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lookup is unauthenticated by design (it's how a farmer resumes with just
// their token) — this caps how fast one IP can scan the token space.
const LOOKUP_RATE_LIMIT = 20;
const LOOKUP_RATE_WINDOW_SECONDS = 600;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();

  if (!id) return badRequest("Enter your token number.");
  if (!MEMBER_ID_RE.test(id)) {
    return notFound(
      "We couldn't find a pre-registration with that token. Check the number or start a new pre-registration."
    );
  }

  const limited = await rateLimit("lookup", clientIp(req), LOOKUP_RATE_LIMIT, LOOKUP_RATE_WINDOW_SECONDS);
  if (limited) return limited;

  try {
    await ensureSchema();
    const db = sql();

    const rows = await db`SELECT * FROM farmers WHERE member_id = ${id}`;
    if (rows.length === 0) {
      return notFound(
        "We couldn't find a pre-registration with that token. Check the number or start a new pre-registration."
      );
    }
    const row = rows[0] as Record<string, unknown>;

    const cropRows = await db`
      SELECT crop FROM farmer_crops WHERE member_id = ${id} ORDER BY crop
    `;

    const paymentStatus: "pending" | "paid" = (await hasConfirmedPayment(id)) ? "paid" : "pending";

    const str = (v: unknown) => String(v ?? "");

    // Only what the ID-card flow needs. A token is printed on the card and
    // used in the public verify URL, so it must not unlock NIN, BVN, phone,
    // email or address.
    return Response.json(
      {
        success: true,
        data: {
          memberId: row.member_id as string,
          firstName: str(row.first_name),
          lastName: str(row.last_name),
          otherNames: str(row.other_names),
          dob: str(row.dob),
          gender: str(row.gender),
          state: str(row.state),
          lga: str(row.lga),
          crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
          farmSizeHectares: str(row.farm_size_hectares),
          yearsFarming: str(row.years_farming),
          nokName: str(row.nok_name),
          nokRelationship: str(row.nok_relationship),
          kycType: str(row.kyc_type),
          verificationStatus: str(row.verification_status) || "pending",
          virtualAccountNumber: str(row.virtual_account_number),
          virtualAccountBank: str(row.virtual_account_bank),
          virtualAccountCustomerId: str(row.virtual_account_customer_id),
          paymentMethod: str(row.payment_method),
          checkoutInvoiceId: str(row.checkout_invoice_id),
          ussdCode: str(row.ussd_code),
          ussdBankCode: str(row.ussd_bank_code),
          paymentStatus,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return serverError("lookup", err, "Could not look up this token.");
  }
}
