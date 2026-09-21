import { ensureSchema, logAdminEvent, sql } from "@/lib/db";
import { buildFarmerFilter } from "@/lib/admin-filters";
import { clientIp, serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 50_000;

const COLUMNS = [
  "member_id", "first_name", "last_name", "other_names", "dob", "gender", "marital_status",
  "phone", "email", "nin", "bvn", "residential_address", "state", "lga", "community", "cluster",
  "farm_size_hectares", "years_farming", "nok_name", "nok_relationship", "nok_phone",
  "kyc_type", "verification_status", "virtual_account_number", "virtual_account_bank",
  "payment_method", "created_at", "verified_at",
] as const;

const DATE_COLUMNS = new Set<string>(["created_at", "verified_at"]);

/**
 * Farmers type most of these fields themselves, so a value like `=HYPERLINK(...)`
 * would run as a formula when the file is opened in Excel/Sheets. Prefixing a
 * quote makes it inert text.
 */
function csvEscape(value: unknown): string {
  let str = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const db = sql();
    const url = new URL(req.url);
    const { where, params } = buildFarmerFilter(url.searchParams);

    const selectCols = COLUMNS.map((c) => (DATE_COLUMNS.has(c) ? `to_char(f.${c} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS ${c}` : `f.${c}`)).join(", ");
    const rows = await db.query(
      `SELECT ${selectCols},
              COALESCE((SELECT string_agg(c.crop, '; ' ORDER BY c.crop) FROM farmer_crops c WHERE c.member_id = f.member_id), '') AS crops,
              EXISTS (
                SELECT 1 FROM payments p WHERE p.member_id = f.member_id AND p.status = 'paid'
              ) AS paid
       FROM farmers f
       ${where}
       ORDER BY f.created_at DESC
       LIMIT ${MAX_ROWS}`,
      params
    );

    const header = [...COLUMNS, "crops", "paid"].join(",");
    const lines = (rows as Array<Record<string, unknown>>).map((row) =>
      [
        ...COLUMNS.map((c) => csvEscape(row[c])),
        csvEscape(row.crops),
        csvEscape(row.paid ? "paid" : "pending"),
      ].join(",")
    );

    await logAdminEvent("export_csv", clientIp(req), `${rows.length} rows${where ? " (filtered)" : ""}`);

    // BOM so Excel reads the file as UTF-8 (Hausa letters, accents) instead of garbling it.
    const csv = `﻿${[header, ...lines].join("\r\n")}\r\n`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fffcsl-farmers-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return serverError("admin-export", err, "Could not export farmers.");
  }
}
