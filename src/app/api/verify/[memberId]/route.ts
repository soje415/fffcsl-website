import { ensureSchema, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const id = decodeURIComponent(memberId ?? "").trim();

  if (!id) {
    return Response.json(
      { success: false, error: "Member ID is required." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    const db = sql();

    const rows = await db`
      SELECT member_id, first_name, last_name, state, lga, photo, created_at
      FROM farmers WHERE member_id = ${id}
    `;

    if (rows.length === 0) {
      return Response.json(
        { success: false, error: "No FFFCSL member found with that ID." },
        { status: 404 }
      );
    }

    const row = rows[0] as Record<string, unknown>;
    const cropRows = await db`
      SELECT crop FROM farmer_crops WHERE member_id = ${id} ORDER BY crop
    `;

    const createdAt = new Date(row.created_at as string);
    const validTill = new Date(createdAt);
    validTill.setFullYear(validTill.getFullYear() + 2);

    return Response.json({
      success: true,
      member: {
        memberId: row.member_id as string,
        firstName: row.first_name as string,
        lastName: row.last_name as string,
        state: row.state as string,
        lga: row.lga as string,
        crops: (cropRows as Array<{ crop: string }>).map((c) => c.crop),
        hasPhoto: Boolean(row.photo),
        memberSince: createdAt.getFullYear(),
        validTill: validTill.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not verify this member.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
