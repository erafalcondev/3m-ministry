import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zwspofxlpumqmxbaknyz.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.3mministry.com" }],
        destination: "https://3mministry.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
