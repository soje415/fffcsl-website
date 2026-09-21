/** Builds a parameterized WHERE clause for the admin farmers list/export, filtering on the `f` alias. */
export function buildFarmerFilter(searchParams: URLSearchParams): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const q = searchParams.get("q")?.trim().slice(0, 100);
  if (q) {
    params.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
    const idx = params.length;
    conditions.push(
      `(f.member_id ILIKE $${idx} OR f.first_name ILIKE $${idx} OR f.last_name ILIKE $${idx} OR f.phone ILIKE $${idx} OR f.nin ILIKE $${idx} OR f.bvn ILIKE $${idx})`
    );
  }

  const state = searchParams.get("state")?.trim().slice(0, 60);
  if (state) {
    params.push(state);
    conditions.push(`f.state = $${params.length}`);
  }

  const status = searchParams.get("status")?.trim();
  if (status && ["verified", "pending", "mismatch"].includes(status)) {
    params.push(status);
    conditions.push(`f.verification_status = $${params.length}`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}
