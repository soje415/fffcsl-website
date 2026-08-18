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
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
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
  schemaReady = true;
}
