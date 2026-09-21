import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const res = Response.json({ success: true });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return res;
}
