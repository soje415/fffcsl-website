import { ensureSchema, sql } from "@/lib/db";
import { buildFarmerFilter } from "@/lib/admin-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  "member_id", "first_name", "last_name", "other_names", "dob", "gender", "marital_status",
  "phone", "email", "nin", "bvn", "residential_address", "state", "lga", "community", "cluster",
  "farm_size_hectares", "years_farming", "nok_name", "nok_relationship", "nok_phone",
  "kyc_type", "verification_status", "virtual_account_number", "virtual_account_bank",
  "payment_method", "created_at",
] as const;

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const db = sql();
    const url = new URL(req.url);
    const { where, params } = buildFarmerFilter(url.searchParams);

    const selectCols = COLUMNS.map((c) => `f.${c}`).join(", ");
    const rows = await db.query(
      `SELECT ${selectCols},
              EXISTS (
                SELECT 1 FROM payments p WHERE p.member_id = f.member_id AND p.status = 'paid'
              ) AS paid
       FROM farmers f
       ${where}
       ORDER BY f.created_at DESC`,
      params
    );

    const header = [...COLUMNS, "paid"].join(",");
    const lines = (rows as Array<Record<string, unknown>>).map((row) =>
      [...COLUMNS.map((c) => csvEscape(row[c])), csvEscape(row.paid ? "paid" : "pending")].join(",")
    );
    const csv = [header, ...lines].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fffcsl-farmers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not export farmers.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
