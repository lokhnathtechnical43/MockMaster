import type { NextConfig } from "next";

const isAndroidBuild = process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig: NextConfig = {
  // Only use static export for Android/Capacitor builds
  // Vercel deployment uses server-side rendering for better performance
  ...(isAndroidBuild ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
