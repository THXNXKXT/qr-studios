import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-c524ba7493174154804c42d8cc0d0aaf.r2.dev",
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
  },

  // Security headers for production
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Experimental features (Next.js 16+)
  experimental: {
    // Enable PPR for faster page loads
    // ppr: true,
  },

  // Disable powered by header
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Production source maps (disable for security, enable for debugging)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
