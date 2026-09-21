import { checkRateLimit } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  timingSafePasswordEqual,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const withinLimit = await checkRateLimit(`admin-login:${ip}`, 10, 300);
  if (!withinLimit) {
    return Response.json(
      { success: false, error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const adminPin = process.env.ADMIN_PIN;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminPin || !sessionSecret) {
    return Response.json(
      { success: false, error: "Admin login is not configured." },
      { status: 500 }
    );
  }

  const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!pin || !(await timingSafePasswordEqual(pin, adminPin))) {
    return Response.json({ success: false, error: "Incorrect PIN." }, { status: 401 });
  }

  const token = await createSessionToken(sessionSecret);
  const res = Response.json({ success: true });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`
  );
  return res;
}
