import path from "path";
import type { NextConfig } from "next";

// Set by the GitHub Pages workflow to "/<repo-name>" since project pages are
// served from a subpath (username.github.io/repo-name). Empty for local dev
// and for any future host that serves the app from the domain root.
const basePath = process.env.NEXT_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
