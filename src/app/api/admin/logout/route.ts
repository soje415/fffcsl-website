import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { crossOriginBlocked } from "@/lib/security";

export async function POST(req: Request) {
  const blocked = crossOriginBlocked(req);
  if (blocked) return blocked;

  const res = Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
  return res;
}
