import path from "path";
import type { NextConfig } from "next";

// GitHub Pages (static) sets NEXT_STATIC_EXPORT=1 and NEXT_BASE_PATH to the
// repo subpath. Everywhere else (local dev, Vercel) the app builds serverful
// so the /api/hyparrow route handlers can proxy Hyparrow server-to-server.
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_BASE_PATH ?? "";

// Everything the site loads is same-origin (fonts are self-hosted at build
// time, there are no third-party scripts, embeds or analytics). 'unsafe-inline'
// is needed because Next.js and framer-motion emit inline scripts/styles.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  basePath,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(staticExport
    ? {}
    : {
        async headers() {
          return [
            { source: "/:path*", headers: securityHeaders },
            // Pages only: API routes set their own policy (e.g. the photo
            // route's sandbox), which a site-wide CSP would otherwise override.
            ...(process.env.NODE_ENV === "production"
              ? [{ source: "/((?!api/).*)", headers: [{ key: "Content-Security-Policy", value: csp }] }]
              : []),
          ];
        },
      }),
};

export default nextConfig;
