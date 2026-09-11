import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Pin the workspace root. Without this Turbopack walks up and finds a
    // stray package-lock.json outside the repo, then warns on every start.
    root: __dirname,
  },
};

export default nextConfig;
