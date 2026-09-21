import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, adminSessionKey, verifySessionToken } from "@/lib/admin-auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

// Admin pages and data must never be cached or indexed, signed in or not.
function locked(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return locked(NextResponse.next());

  const key = adminSessionKey();
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authed = Boolean(key && token && (await verifySessionToken(token, key)));

  if (authed) return locked(NextResponse.next());

  if (pathname.startsWith("/api/admin")) {
    return locked(NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 }));
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return locked(NextResponse.redirect(url));
}
