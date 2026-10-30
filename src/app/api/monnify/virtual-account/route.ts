import { createReservedAccount } from "@/lib/providers/monnify";
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
  bvn: string;
  virtual_account_number: string;
  virtual_account_bank: string;
  virtual_account_customer_id: string;
};

/** Monnify's accountReference can't contain slashes; the token can. */
function toAccountReference(memberId: string): string {
  return memberId.replace(/\//g, "-");
}

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

    const ipLimited = await rateLimit("mn-va-ip", clientIp(req), 20, 3600);
    if (ipLimited) return ipLimited;
    const memberLimited = await rateLimit("mn-va-member", memberId, 6, 3600);
    if (memberLimited) return memberLimited;

    await ensureSchema();
    const db = sql();
    const rows = await db`
      SELECT first_name, last_name, email, phone, bvn,
             virtual_account_number, virtual_account_bank, virtual_account_customer_id
      FROM farmers WHERE member_id = ${memberId}
    `;
    if (rows.length === 0) return notFound("We couldn't find that token.");
    const farmer = rows[0] as FarmerRow;

    if (await hasConfirmedPayment(memberId)) {
      return Response.json({ success: false, error: "This membership fee has already been paid." }, { status: 409 });
    }

    // Hand back the account already issued to this member instead of
    // reserving another one against the same reference.
    if (farmer.virtual_account_number && farmer.virtual_account_customer_id) {
      const existing = await db`
        SELECT account_name FROM payments
        WHERE customer_id = ${farmer.virtual_account_customer_id} AND member_id = ${memberId} AND provider = 'monnify'
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

    const serial = memberId.split("/").pop() ?? memberId;
    // Monnify allows one reserved account per customer, matched on email and
    // BVN. Applicants often share an email or reuse a BVN, so the account is
    // keyed to a per-member address instead and no BVN is sent; their real
    // contact details stay in our own records.
    const email = `member-${serial}@fadamacooperative.com`;
    const accountName = `${farmer.first_name} ${farmer.last_name}`.trim() || "FFFCSL Member";

    const account = await createReservedAccount({
      accountReference: toAccountReference(memberId),
      accountName,
      customerEmail: email,
      customerName: accountName,
    });

    // If we can't record it, don't hand out an account we can't track: a
    // payment into it would never be credited to anyone.
    await db`
      INSERT INTO payments (customer_id, member_id, amount_kobo, status, account_number, bank_name, account_name, provider)
      VALUES (${account.accountReference}, ${memberId}, ${ID_CARD_FEE_KOBO}, 'pending',
              ${account.accountNumber}, ${account.bankName}, ${account.accountName}, 'monnify')
      ON CONFLICT (customer_id) DO UPDATE SET
        account_number = EXCLUDED.account_number,
        bank_name = EXCLUDED.bank_name,
        account_name = EXCLUDED.account_name
    `;

    await db`
      UPDATE farmers SET
        payment_method = 'bankTransfer',
        virtual_account_number = ${account.accountNumber},
        virtual_account_bank = ${account.bankName},
        virtual_account_customer_id = ${account.accountReference}
      WHERE member_id = ${memberId}
    `;

    return Response.json({
      success: true,
      account: {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        bankName: account.bankName,
        customerId: account.accountReference,
        reference: account.accountReference,
      },
    });
  } catch (err) {
    if ((err as { status?: number })?.status) return providerError("monnify-virtual-account", err);
    return serverError("monnify-virtual-account", err, "Could not set up your payment account. Please try again.");
  }
}
