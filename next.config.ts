import type { NextConfig } from "next";

function deriveMinioHostname(): string {
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  if (publicUrl) {
    try { return new URL(publicUrl).hostname; } catch { /* fall through */ }
  }
  return process.env.MINIO_PUBLIC_HOSTNAME ?? "s3.yourdomain.com";
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: deriveMinioHostname(),
      },
    ],
  },
};

export default nextConfig;
