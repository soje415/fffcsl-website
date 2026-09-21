import { createVirtualAccount } from "@/lib/providers/hyparrow";
import { ensureSchema, hasConfirmedPayment, sql } from "@/lib/db";
import {
  MEMBER_ID_RE,
  clientIp,
  crossOriginBlocked,
  ID_CARD_FEE_KOBO,
  notFound,
  providerError,
  rateLimit,
  readJson,
  serverError,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FarmerRow = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  residential_address: string;
  virtual_account_number: string;
  virtual_account_bank: string;
  virtual_account_customer_id: string;
};

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  try {
    const body = await readJson(req, 4096);
    if (body.error) return body.error;

    // Only the token is taken from the client. Name, phone, email and the
    // amount come from our own records so this can't be used to mint payment
    // accounts for arbitrary people or amounts.
    const memberId = String(body.data.memberId ?? "").trim();
    if (!MEMBER_ID_RE.test(memberId)) return notFound("We couldn't find that token.");

    const ipLimited = await rateLimit("va-ip", clientIp(req), 20, 3600);
    if (ipLimited) return ipLimited;
    const memberLimited = await rateLimit("va-member", memberId, 6, 3600);
    if (memberLimited) return memberLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT first_name, last_name, email, phone, dob, residential_address,
             virtual_account_number, virtual_account_bank, virtual_account_customer_id
      FROM farmers WHERE member_id = ${memberId}
    `;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as FarmerRow;

    if (await hasConfirmedPayment(memberId)) {
      return Response.json({ success: false, error: "This membership fee has already been paid." }, { status: 409 });
    }

    // Hand back the account already issued to this member instead of creating another customer.
    if (farmer.virtual_account_number && farmer.virtual_account_customer_id) {
      const existing = await db`
        SELECT account_name FROM payments
        WHERE customer_id = ${farmer.virtual_account_customer_id} AND member_id = ${memberId}
      `;
      if (existing.length > 0) {
        return Response.json({
          success: true,
          account: {
            accountNumber: farmer.virtual_account_number,
            accountName: (existing[0] as { account_name: string }).account_name ?? "",
            bankName: farmer.virtual_account_bank,
            customerId: farmer.virtual_account_customer_id,
            reference: farmer.virtual_account_customer_id,
          },
        });
      }
    }

    // Email became optional at registration, but Hyparrow needs one per customer.
    const serial = memberId.split("/").pop() ?? memberId;
    const email = farmer.email || `member-${serial}@fadamacooperative.com`;

    const account = await createVirtualAccount({
      firstName: farmer.first_name,
      lastName: farmer.last_name,
      email,
      phoneNumber: farmer.phone,
      dateOfBirth: farmer.dob || undefined,
      address: farmer.residential_address || undefined,
    });

    // If we can't record it, don't hand out an account we can't track: a
    // payment into it would never be credited to anyone.
    const saved = await db`
      INSERT INTO payments (customer_id, member_id, amount_kobo, status, account_number, bank_name, account_name)
      VALUES (${account.customerId}, ${memberId}, ${ID_CARD_FEE_KOBO}, 'pending',
              ${account.accountNumber}, ${account.bankName}, ${account.accountName})
      ON CONFLICT (customer_id) DO UPDATE SET
        member_id = COALESCE(payments.member_id, EXCLUDED.member_id),
        account_number = EXCLUDED.account_number,
        bank_name = EXCLUDED.bank_name,
        account_name = EXCLUDED.account_name
      RETURNING member_id
    `;
    const owner = (saved[0] as { member_id: string | null } | undefined)?.member_id;
    if (owner !== memberId) {
      // Hyparrow matched this phone/email to a customer already linked to another member.
      // Reassigning it would hand that member's paid status to this one.
      return Response.json(
        {
          success: false,
          error:
            "This phone number or email is already linked to another member's payment account. Please pay with USSD or OPay instead.",
        },
        { status: 409 }
      );
    }

    await db`
      UPDATE farmers SET
        payment_method = 'bankTransfer',
        virtual_account_number = ${account.accountNumber},
        virtual_account_bank = ${account.bankName},
        virtual_account_customer_id = ${account.customerId}
      WHERE member_id = ${memberId}
    `;

    return Response.json({ success: true, account });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("virtual-account", err);
    return serverError("virtual-account", err, "Could not set up your payment account. Please try again.");
  }
}
