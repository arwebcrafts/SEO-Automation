/** @type {import('next').NextConfig} */
const nextConfig = {
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
    '**/seo-autofix-remotion/**': [],
  },
  // Exclude Remotion directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
