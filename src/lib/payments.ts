import { ensureSchema, sql } from "@/lib/db";
import { smsPaymentReceived, type Lang } from "@/lib/notify";

/**
 * The only place a payment flips to "paid". The UPDATE only matches rows that
 * aren't paid yet, so exactly one caller (webhook or status poll) sees the
 * transition and sends the receipt SMS.
 */
export async function markPaymentPaid(customerId: string, lang: Lang = "en"): Promise<boolean> {
  await ensureSchema();
  const rows = await sql()`
    UPDATE payments
    SET status = 'paid', paid_at = COALESCE(paid_at, now())
    WHERE customer_id = ${customerId} AND status <> 'paid'
    RETURNING member_id
  `;
  if (rows.length === 0) return false;

  const memberId = (rows[0] as { member_id: string | null }).member_id;
  if (memberId) {
    const farmer = await sql()`SELECT phone FROM farmers WHERE member_id = ${memberId}`;
    const phone = (farmer[0] as { phone?: string } | undefined)?.phone;
    if (phone) smsPaymentReceived(phone, lang);
  }
  return true;
}

export type PaymentRow = {
  customer_id: string;
  member_id: string | null;
  status: string;
  account_number: string;
};

export async function getPayment(customerId: string): Promise<PaymentRow | null> {
  await ensureSchema();
  const rows = await sql()`
    SELECT customer_id, member_id, status, COALESCE(account_number, '') AS account_number
    FROM payments WHERE customer_id = ${customerId}
  `;
  return (rows[0] as PaymentRow | undefined) ?? null;
}
