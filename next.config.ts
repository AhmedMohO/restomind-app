import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const isProd = process.env.NODE_ENV === "production"
function buildConnectSrc(): string {
  const origins = new Set<string>(["'self'"])

  for (const envVar of [process.env.API_URL, process.env.NEXT_PUBLIC_WS_URL]) {
    if (!envVar) continue
    try {
      const url = new URL(envVar)
      const host = url.host
      // Cover HTTP, HTTPS, WS, and WSS for the target host
      origins.add(`http://${host}`)
      origins.add(`https://${host}`)
      origins.add(`ws://${host}`)
      origins.add(`wss://${host}`)
    } catch {
      // Malformed URL — skip silently; the env var validation in
      // lib/auth/config.ts will catch this at runtime.
    }
  }

  return [...origins].join(" ")
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  cacheComponents: true,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          `connect-src ${buildConnectSrc()}`,
          "frame-ancestors 'none'",
        ].join("; "),
      },
      ...(isProd
        ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]
        : []),
    ]

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
