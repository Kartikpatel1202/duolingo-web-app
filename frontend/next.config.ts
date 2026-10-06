import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright builds into its own directory so e2e runs never clash with `next dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
