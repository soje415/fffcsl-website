import path from "path";
import type { NextConfig } from "next";

// GitHub Pages (static) sets NEXT_STATIC_EXPORT=1 and NEXT_BASE_PATH to the
// repo subpath. Everywhere else (local dev, Vercel) the app builds serverful
// so the /api/hyparrow route handlers can proxy Hyparrow server-to-server.
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: staticExport ? "export" : undefined,
  basePath,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
