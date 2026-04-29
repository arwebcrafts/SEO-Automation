/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["playwright"],
  // Exclude Remotion project from Next.js build output tracing
  outputFileTracingExcludes: {
    '*': ['./seo-autofix-remotion/**/*'],
  },
  // Exclude Remotion directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
