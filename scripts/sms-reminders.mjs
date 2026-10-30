// Texts every applicant who hasn't paid the ID card fee a link to finish.
//
//   node --env-file=.env --env-file=.env.local scripts/sms-reminders.mjs            # dry run (default)
//   node --env-file=.env --env-file=.env.local scripts/sms-reminders.mjs --send     # actually send
//
// Flags: --send  --limit N  --only-started (just those who already opened a payment)
//        --resend (include people already reminded)  --delay MS (default 250)
//
// Mirrors src/lib/sms-templates.ts and src/lib/providers/termii.ts, which are
// TypeScript and can't be imported from a plain script; keep them in step.
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SEND = flag("send");
const LIMIT = Number(value("limit", "0")) || Infinity;
const DELAY_MS = Number(value("delay", "250"));
const SITE_URL = (process.env.SITE_URL ?? "https://fadamacooperative.com").replace(/\/+$/, "");
const FEE = (2500).toLocaleString("en-NG");

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set.`);
  return v;
}

function toInternational(phone) {
  let d = String(phone).replace(/\D/g, "");
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return `234${d.slice(1)}`;
  if (d.length === 10) return `234${d}`;
  return d;
}
const validPhone = (p) => /^234[789]\d{9}$/.test(toInternational(p));

const message = (memberId) =>
  `FFFCSL: Pay N${FEE} to get your ID card: ${SITE_URL}/membership/id-card?token=${memberId} Token: ${memberId}`;

async function termiiBalance() {
  const base = need("TERMII_BASE_URL").replace(/\/+$/, "");
  const res = await fetch(`${base}/api/get-balance?api_key=${encodeURIComponent(need("TERMII_API_KEY"))}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message ?? `Termii balance check failed (${res.status})`);
  return body; // { user, balance, currency }
}

async function sendSms(phone, text) {
  const base = need("TERMII_BASE_URL").replace(/\/+$/, "");
  const res = await fetch(`${base}/api/sms/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: need("TERMII_API_KEY"),
      to: toInternational(phone),
      from: need("TERMII_SENDER_ID"),
      sms: text,
      type: "plain",
      channel: process.env.TERMII_CHANNEL ?? "generic",
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? body?.error ?? `Termii SMS failed (${res.status})`);
  }
}

const db = neon(need("DATABASE_URL"));

async function withRetry(fn, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

async function main() {
  // The log only exists to stop a rerun texting the same person twice. A dry
  // run must not write anything, so the table is created only when sending.
  if (SEND) {
    await withRetry(
      () => db`CREATE TABLE IF NOT EXISTS sms_reminders (
        member_id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    );
  }
  const logExists = (await withRetry(() => db`SELECT to_regclass('public.sms_reminders') AS t`))[0].t !== null;

  const rows = await withRetry(
    () => db`
      SELECT f.member_id, f.first_name, f.phone, f.created_at,
             (f.virtual_account_number <> '' OR f.checkout_invoice_id <> '' OR COALESCE(f.monnify_transaction_ref, '') <> '') AS started,
             false AS reminded
      FROM farmers f
      WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.member_id = f.member_id AND p.status = 'paid')
      ORDER BY f.created_at DESC
    `
  );

  const remindedIds = logExists
    ? new Set((await withRetry(() => db`SELECT member_id FROM sms_reminders`)).map((x) => x.member_id))
    : new Set();
  for (const r of rows) r.reminded = remindedIds.has(r.member_id);

  const stats = { unpaid: rows.length, badPhone: 0, duplicatePhone: 0, alreadyReminded: 0, notStarted: 0 };
  const seen = new Set();
  const targets = [];
  for (const r of rows) {
    if (!validPhone(r.phone)) {
      stats.badPhone++;
      continue;
    }
    const phone = toInternational(r.phone);
    // Several registrations can share one phone; one text is enough, and the
    // newest registration (first, given the ORDER BY) is the one they'd finish.
    if (seen.has(phone)) {
      stats.duplicatePhone++;
      continue;
    }
    seen.add(phone);
    if (r.reminded && !flag("resend")) {
      stats.alreadyReminded++;
      continue;
    }
    if (flag("only-started") && !r.started) {
      stats.notStarted++;
      continue;
    }
    targets.push(r);
  }
  const batch = targets.slice(0, LIMIT);

  console.log(SEND ? "MODE: SEND" : "MODE: DRY RUN (nothing will be sent)");
  console.log("Unpaid applicants:", stats.unpaid);
  console.log("  skipped, invalid phone:      ", stats.badPhone);
  console.log("  skipped, duplicate phone:    ", stats.duplicatePhone);
  console.log("  skipped, already reminded:   ", stats.alreadyReminded);
  if (flag("only-started")) console.log("  skipped, never opened payment:", stats.notStarted);
  console.log("Texts to send:", batch.length, batch.length < targets.length ? `(limited from ${targets.length})` : "");

  const sample = batch[0] ? message(batch[0].member_id) : message("FFFCSL/2026/000000000");
  console.log(`Sample (${sample.length} chars, ${sample.length <= 160 ? 1 : Math.ceil(sample.length / 153)} SMS part(s) each):`);
  console.log("  " + sample);

  try {
    const bal = await termiiBalance();
    console.log(`Termii balance: ${bal.balance} ${bal.currency ?? ""}`.trim());
  } catch (err) {
    console.log("Termii balance: could not check (" + err.message + ")");
    if (SEND) throw err;
  }

  if (!SEND) {
    console.log("\nFirst 10 recipients:");
    for (const r of batch.slice(0, 10)) console.log(`  ${r.member_id}  ${r.first_name}  ${String(r.phone).slice(0, 4)}***${String(r.phone).slice(-3)}`);
    console.log("\nDry run only. Add --send to text these people.");
    return;
  }

  let sent = 0;
  let failedInARow = 0;
  for (const r of batch) {
    try {
      await sendSms(r.phone, message(r.member_id));
      await withRetry(
        () => db`INSERT INTO sms_reminders (member_id, phone) VALUES (${r.member_id}, ${toInternational(r.phone)}) ON CONFLICT (member_id) DO UPDATE SET sent_at = now()`
      );
      sent++;
      failedInARow = 0;
    } catch (err) {
      failedInARow++;
      console.error(`FAILED ${r.member_id}: ${err.message}`);
      // Out of credit or a bad sender ID fails every message; don't grind through the list.
      if (failedInARow >= 5) {
        console.error("5 failures in a row; stopping.");
        break;
      }
    }
    if (sent % 50 === 0 && sent > 0) console.log(`  ...${sent}/${batch.length} sent`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`Done. Sent ${sent} of ${batch.length}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
