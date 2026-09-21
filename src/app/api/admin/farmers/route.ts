import { ensureSchema, sql } from "@/lib/db";
import { buildFarmerFilter } from "@/lib/admin-filters";
import { serverError } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureSchema();
    const db = sql();
    const url = new URL(req.url);
    const { where, params } = buildFarmerFilter(url.searchParams);

    const int = (name: string, fallback: number) => {
      const n = Number(url.searchParams.get(name));
      return Number.isInteger(n) && n > 0 ? n : fallback;
    };
    const page = Math.min(int("page", 1), 100_000);
    const pageSize = Math.min(int("pageSize", 25), 100);
    const offset = (page - 1) * pageSize;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const rows = await db.query(
      `SELECT f.member_id, f.first_name, f.last_name, f.phone, f.email, f.state, f.lga,
              f.community, f.verification_status, f.photo, f.created_at,
              EXISTS (
                SELECT 1 FROM payments p WHERE p.member_id = f.member_id AND p.status = 'paid'
              ) AS paid
       FROM farmers f
       ${where}
       ORDER BY f.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, pageSize, offset]
    );

    const countRows = await db.query(`SELECT COUNT(*)::int AS total FROM farmers f ${where}`, params);
    const total = (countRows[0] as { total: number } | undefined)?.total ?? 0;

    const summaryRows = await db.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE verification_status = 'verified')::int AS verified,
         COUNT(*) FILTER (WHERE verification_status = 'pending')::int AS pending_verification,
         COUNT(*) FILTER (WHERE verification_status = 'mismatch')::int AS mismatch
       FROM farmers`,
      []
    );
    const paidCountRows = await db.query(
      `SELECT COUNT(DISTINCT member_id)::int AS paid FROM payments WHERE status = 'paid' AND member_id IS NOT NULL`,
      []
    );

    return Response.json(
      {
      success: true,
      farmers: rows,
      total,
      page,
      pageSize,
      summary: {
        ...(summaryRows[0] as Record<string, number>),
        paid: (paidCountRows[0] as { paid: number } | undefined)?.paid ?? 0,
      },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return serverError("admin-farmers", err, "Could not load farmers.");
  }
}
