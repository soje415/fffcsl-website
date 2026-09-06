import { checkRateLimit, ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lookup is unauthenticated by design (it's how a farmer resumes with just
// their token) — this caps how fast one IP can scan the token space.
const LOOKUP_RATE_LIMIT = 20;
const LOOKUP_RATE_WINDOW_SECONDS = 600;

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();

  if (!id) {
    return Response.json(
      { success: false, error: "Enter your token number." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  if (ip) {
    const withinLimit = await checkRateLimit(`lookup:${ip}`, LOOKUP_RATE_LIMIT, LOOKUP_RATE_WINDOW_SECONDS);
    if (!withinLimit) {
      return Response.json(
        { success: false, error: "Too many attempts. Please wait a while and try again." },
        { status: 429 }
      );
    }
  }

  try {
    await ensureSchema();
    const db = sql();

    const rows = await db`SELECT * FROM farmers WHERE member_id = ${id}`;
    if (rows.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "We couldn't find a pre-registration with that token. Check the number or start a new pre-registration.",
        },
        { status: 404 }
      );
    }
    const row = rows[0] as Record<string, unknown>;

    const cropRows = await db`
      SELECT crop FROM farmer_crops WHERE member_id = ${id} ORDER BY crop
    `;

    const paymentStatus: "pending" | "paid" = (await hasConfirmedPayment(id)) ? "paid" : "pending";

    const str = (v: unknown) => String(v ?? "");

    return Response.json({
      success: true,
      data: {
        memberId: row.member_id as string,
        firstName: str(row.first_name),
        lastName: str(row.last_name),
        otherNames: str(row.other_names),
        dob: str(row.dob),
        gender: str(row.gender),
        maritalStatus: str(row.marital_status),
        phone: str(row.phone),
        email: str(row.email),
        residentialAddress: str(row.residential_address),
        state: str(row.state),
        lga: str(row.lga),
        community: str(row.community),
        cluster: str(row.cluster),
        crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
        farmSizeHectares: str(row.farm_size_hectares),
        yearsFarming: str(row.years_farming),
        nokName: str(row.nok_name),
        nokRelationship: str(row.nok_relationship),
        nokPhone: str(row.nok_phone),
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not look up this token.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
