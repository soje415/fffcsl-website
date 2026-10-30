// Moves existing Hyparrow customers off their old virtual account (Wema) onto
// the new one, per https://docs.hyparrow.com/customer-account-migration.
//
//   node --env-file=.env --env-file=.env.local scripts/hyparrow-migrate.mjs             # dry run (default, read-only)
//   node --env-file=.env --env-file=.env.local scripts/hyparrow-migrate.mjs --migrate   # request the moves
//   node --env-file=.env --env-file=.env.local scripts/hyparrow-migrate.mjs --status    # who is still pending
//
// Flags: --migrate  --status  --limit N  --unpaid-only  --delay MS (default 400)
//
// The old number keeps crediting until Hyparrow retires it, and customer IDs
// never change, so payment confirmation (keyed on customerId) is unaffected.
// Each move needs the customer's BVN plus names that match it; we send what
// the farmer registered with, so a mismatch shows up as a 422 per customer.
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const value = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const MIGRATE = flag("migrate");
const STATUS = flag("status");
const LIMIT = Number(value("limit", "0")) || Infinity;
const DELAY_MS = Number(value("delay", "400"));

const need = (n) => {
  const v = process.env[n];
  if (!v) throw new Error(`${n} is not set.`);
  return v;
};
const base = (process.env.HYPARROW_BASE_URL ?? "https://api.hyparrow.cloud/api/v1").replace(/\/+$/, "");
const headers = () => ({
  "X-API-Key": need("HYPARROW_API_KEY"),
  "X-API-Secret": need("HYPARROW_API_SECRET"),
  "Content-Type": "application/json",
});

async function api(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  return { status: res.status, payload };
}

async function listAllCustomers() {
  const all = [];
  for (let page = 1; page < 200; page++) {
    const { status, payload } = await api(`/customers?page=${page}&limit=100`);
    if (status !== 200) throw new Error(`List customers failed (${status}): ${payload?.message ?? payload?.error ?? ""}`);
    const batch = payload?.data ?? [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  // Defensive: if the API ignores paging it returns the same page repeatedly.
  return [...new Map(all.map((c) => [c.id, c])).values()];
}

const db = neon(need("DATABASE_URL"));
const retry = async (fn, n = 4) => {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= n) throw e;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
};

async function main() {
  const customers = await listAllCustomers();
  const needing = customers.filter((c) => c.migrationRequired);
  const pending = customers.filter((c) => c.accountPending);
  console.log(`Hyparrow customers: ${customers.length}`);
  console.log(`  migrationRequired: ${needing.length}`);
  console.log(`  accountPending:    ${pending.length}`);

  if (STATUS) {
    for (const c of pending.slice(0, 50)) console.log(`  pending  ${c.id}`);
    return;
  }

  // Match each customer to the registration it was created for.
  const rows = await retry(
    () => db`
      SELECT p.customer_id, p.member_id, p.status, f.bvn, f.first_name, f.last_name
      FROM payments p JOIN farmers f ON f.member_id = p.member_id
      WHERE p.provider = 'hyparrow' AND COALESCE(p.account_number, '') <> ''
    `
  );
  const ours = new Map(rows.map((r) => [r.customer_id, r]));

  const targets = [];
  const skip = { notOurs: 0, noBvn: 0, badBvn: 0, paid: 0 };
  for (const c of needing) {
    const r = ours.get(c.id);
    if (!r) {
      skip.notOurs++;
      continue;
    }
    if (flag("unpaid-only") && r.status === "paid") {
      skip.paid++;
      continue;
    }
    if (!r.bvn) {
      skip.noBvn++;
      continue;
    }
    if (!/^\d{11}$/.test(r.bvn)) {
      skip.badBvn++;
      continue;
    }
    targets.push({ customerId: c.id, memberId: r.member_id, status: r.status, bvn: r.bvn, firstName: r.first_name, lastName: r.last_name });
  }
  const batch = targets.slice(0, LIMIT);

  console.log(MIGRATE ? "\nMODE: MIGRATE" : "\nMODE: DRY RUN (nothing will be requested)");
  console.log("  can migrate now:                ", targets.length, `(${targets.filter((t) => t.status === "paid").length} paid, ${targets.filter((t) => t.status !== "paid").length} unpaid)`);
  console.log("  skipped, not one of our records:", skip.notOurs);
  console.log("  skipped, no BVN on file:        ", skip.noBvn, "(needs the farmer's BVN first)");
  console.log("  skipped, BVN not 11 digits:     ", skip.badBvn);
  if (flag("unpaid-only")) console.log("  skipped, already paid:          ", skip.paid);

  if (!MIGRATE) {
    console.log("\nFirst 5:");
    for (const t of batch.slice(0, 5)) console.log(`  ${t.memberId}  ${t.firstName} ${t.lastName}  bvn:***${t.bvn.slice(-3)}`);
    console.log("\nDry run only. Try --migrate --limit 1 first.");
    return;
  }

  const tally = {};
  for (const t of batch) {
    const { status, payload } = await api("/customers/virtual-account/migrate", {
      customerId: t.customerId,
      bvn: t.bvn,
      firstName: t.firstName,
      lastName: t.lastName,
    });
    tally[status] = (tally[status] ?? 0) + 1;
    if (status !== 202) console.error(`  ${t.memberId}: ${status} ${payload?.message ?? payload?.error ?? ""}`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log("Results by HTTP status:", tally, "\nRun --status later; the new numbers arrive on the customer.account.migrated webhook.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
