import { neon } from "@neondatabase/serverless";

function connectionUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return url;
}

export function sql() {
  return neon(connectionUrl());
}

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql()`CREATE TABLE IF NOT EXISTS farmers (
    id BIGSERIAL PRIMARY KEY,
    member_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    other_names TEXT DEFAULT '',
    dob TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    marital_status TEXT DEFAULT '',
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    photo TEXT DEFAULT '',
    residential_address TEXT DEFAULT '',
    state TEXT DEFAULT '',
    lga TEXT DEFAULT '',
    community TEXT DEFAULT '',
    cluster TEXT DEFAULT '',
    farm_size_hectares TEXT DEFAULT '',
    years_farming TEXT DEFAULT '',
    nok_name TEXT DEFAULT '',
    nok_relationship TEXT DEFAULT '',
    nok_phone TEXT DEFAULT '',
    kyc_type TEXT DEFAULT '',
    verification_status TEXT DEFAULT 'pending',
    virtual_account_number TEXT DEFAULT '',
    virtual_account_bank TEXT DEFAULT '',
    virtual_account_customer_id TEXT DEFAULT '',
    payment_method TEXT DEFAULT '',
    checkout_invoice_id TEXT DEFAULT '',
    ussd_code TEXT DEFAULT '',
    ussd_bank_code TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  // Additive columns for farmer rows created by earlier deploys.
  await sql()`ALTER TABLE farmers ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT ''`;
  await sql()`ALTER TABLE farmers ADD COLUMN IF NOT EXISTS checkout_invoice_id TEXT DEFAULT ''`;
  await sql()`ALTER TABLE farmers ADD COLUMN IF NOT EXISTS ussd_code TEXT DEFAULT ''`;
  await sql()`ALTER TABLE farmers ADD COLUMN IF NOT EXISTS ussd_bank_code TEXT DEFAULT ''`;
  await sql()`CREATE TABLE IF NOT EXISTS farmer_crops (
    id BIGSERIAL PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES farmers(member_id) ON DELETE CASCADE,
    crop TEXT NOT NULL
  )`;
  await sql()`CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id TEXT UNIQUE NOT NULL,
    member_id TEXT,
    amount_kobo INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    account_number TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql()`CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  schemaReady = true;
}

/** True once a 'paid' payment row is linked to this member, across any payment method. */
export async function hasConfirmedPayment(memberId: string): Promise<boolean> {
  if (!memberId) return false;
  await ensureSchema();
  const rows = await sql()`
    SELECT 1 FROM payments WHERE member_id = ${memberId} AND status = 'paid' LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Sliding-ish fixed-window rate limit backed by Postgres. Returns true if the
 * caller is still within `limit` hits inside the last `windowSeconds`.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  await ensureSchema();
  const rows = await sql()`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1 ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now() ELSE rate_limits.window_start
      END
    RETURNING count
  `;
  const count = Number((rows[0] as { count: number } | undefined)?.count ?? 0);
  return count <= limit;
}
