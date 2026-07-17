/**
 * proxy.ts — Next.js 16 Proxy (renamed from middleware.ts).
 *
 * Composition: next-intl i18n handling + lightweight auth session check.
 *
 * Authentication uses ONLY the encrypted Iron Session cookie as the source
 * of truth. Role enforcement is NOT performed here (the cookie is opaque
 * and encrypted); it is enforced server-side in layout.tsx via
 * ProtectedRoute / requireRole(). This keeps all other routes fully static.
 */

import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "./i18n/routing"
import { SESSION_COOKIE_NAME, ROUTE_ROLE_MAP } from "./lib/auth/config"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const intlMiddleware = createMiddleware(routing)

const LOCALES = ["en", "ar"] as const
type Locale = (typeof LOCALES)[number]

/**
 * Auth pages — redirect to home if already logged in
 */
const AUTH_PAGE_PATTERNS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
]

/**
 * Protected route prefixes — redirect to login if not logged in.
 * Role enforcement happens inside the route's Server Component, not here.
 * Derived from ROUTE_ROLE_MAP keys so the list never diverges.
 */
const PROTECTED_ROUTE_PATTERNS = Object.keys(ROUTE_ROLE_MAP)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractLocaleAndPath(
  pathname: string
): { locale: Locale; localePath: string } {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return {
        locale,
        localePath: pathname.slice(locale.length + 1) || "/",
      }
    }
  }
  return { locale: "en", localePath: pathname }
}

function isAuthPage(localePath: string): boolean {
  return AUTH_PAGE_PATTERNS.some(
    (pattern) =>
      localePath === pattern || localePath.startsWith(`${pattern}/`)
  )
}

function isProtectedRoute(localePath: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some(
    (pattern) =>
      localePath === pattern || localePath.startsWith(`${pattern}/`)
  )
}

// ---------------------------------------------------------------------------
// Main proxy function (Next.js 16 named export)
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // -------------------------------------------------------------------------
  // Skip next-intl and auth checks for API routes and Next.js internals FIRST
  // -------------------------------------------------------------------------
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel/") ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const { locale, localePath } = extractLocaleAndPath(pathname)

  // Let next-intl handle all locale routing for non-API pages
  const intlResponse = intlMiddleware(request)

  // Set x-pathname for canonical URL resolution in layout metadata
  intlResponse.headers.set("x-pathname", pathname)

  // The encrypted Iron Session cookie is the single source of truth.
  // Its mere presence is enough for a lightweight authed/not-authed
  // decision here. Decryption (for role checks) happens server-side
  // in the protected route's Server Components.
  const isLoggedIn = !!request.cookies.get(SESSION_COOKIE_NAME)?.value

  // -------------------------------------------------------------------------
  // Redirect logged-in users away from auth pages
  // -------------------------------------------------------------------------
  if (isAuthPage(localePath) && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // -------------------------------------------------------------------------
  // Redirect unauthenticated users away from protected routes
  // -------------------------------------------------------------------------
  if (isProtectedRoute(localePath) && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return intlResponse
}

// Support both export conventions
export const middleware = proxy
export default proxy

// ---------------------------------------------------------------------------
// Matcher config
// ---------------------------------------------------------------------------

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
}
