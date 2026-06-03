import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev indicator for clean screen recordings of the hero / room.
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
