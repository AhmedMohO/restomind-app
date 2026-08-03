/**
 * Centralized authentication configuration.
 * All auth-related constants are derived from here — single source of truth.
 */
import type { SessionOptions } from "iron-session"
import type { SessionData, UserRole } from "@/features/auth/auth"

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is not set")
}

if (!process.env.API_URL) {
  throw new Error("API_URL environment variable is not set")
}

/** The base URL of the external REST API (server-only) */
export const API_URL = process.env.API_URL ?? ""

// ---------------------------------------------------------------------------
// Session / Cookie
// ---------------------------------------------------------------------------

/** The name of the encrypted HttpOnly session cookie */
export const SESSION_COOKIE_NAME = "session" as const

/** Iron Session options — cookie is HttpOnly, secure in production */
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
}

// ---------------------------------------------------------------------------
// Token timing
// ---------------------------------------------------------------------------

/**
 * Default access token time-to-live in milliseconds.
 * The API does not return expiresIn, so we compute expiresAt ourselves.
 * Set to 14 minutes — conservative, well within a typical 15-min JWT lifetime.
 */
export const ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000 // 14 minutes

/**
 * How many milliseconds before expiry to proactively refresh the token.
 * Prevents a race condition where the token expires mid-request.
 */
export const REFRESH_BUFFER_MS = 60 * 1000 // 60 seconds

// ---------------------------------------------------------------------------
// Route configuration
// ---------------------------------------------------------------------------

/**
 * Routes that are accessible without authentication.
 * Matched as prefix strings (after stripping the locale segment).
 */
export const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/(en|ar)\/?(login|register|forgot-password|confirm-email|reset-password)?(\/.*)?$/,
  /^\/(en|ar)\/?(products)(\/.*)?$/, // product listing is public
  /^\/api\/auth\/(login|refresh)$/, // public auth API routes
]

/**
 * Roles allowed to access the /dashboard path.
 */
export const DASHBOARD_ALLOWED_ROLES = ["admin", "manager", "staff"] as const

/**
 * Route prefix → required roles.
 * An empty array means "any authenticated user" (auth-only).
 * Routes not listed here are public.
 */
export const ROUTE_ROLE_MAP: Record<string, readonly UserRole[]> = {
  "/dashboard/categories": ["admin"],
  "/dashboard/restaurants/new": ["admin"],
  "/dashboard/users": ["admin", "manager"],
  "/dashboard/ingredients": ["admin", "manager", "staff"],
  "/dashboard/recipes": ["manager"],
  "/dashboard/sales": ["admin", "manager"],
  "/dashboard/predictions": ["manager"],
  "/dashboard/production-plan": ["admin", "manager", "staff"],
  "/dashboard/recommendations": ["manager"],
  "/dashboard/waste": ["manager"],
  "/dashboard/imports": ["admin", "manager"],
  "/dashboard/inventory": ["admin", "manager", "staff"],
  "/dashboard/suppliers": ["admin", "manager", "staff"],
  "/dashboard/purchase-orders": ["admin", "manager", "staff"],
  "/dashboard/products": ["admin", "manager", "staff"],
  "/dashboard/offers": ["admin", "manager", "staff"],
  "/dashboard/orders": ["admin", "manager", "staff"],
  "/dashboard/offers/new": ["manager"],
  "/dashboard/products/new": ["admin", "manager"],
  "/dashboard": DASHBOARD_ALLOWED_ROLES,
  "/orders": [],
  "/favourites": [],
  "/checkout": [],
}

/**
 * Returns the required roles for a given path prefix, or null if the
 * route does not appear in ROUTE_ROLE_MAP (i.e. it is public).
 * Locale prefixes (/en, /ar, …) are stripped before matching.
 */
export function getRouteRoles(path: string): UserRole[] | null {
  // Strip optional locale segment (e.g. /en/dashboard → /dashboard)
  const normalised = path.replace(/^\/[a-z]{2}(\/|$)/, "/")
  for (const [prefix, roles] of Object.entries(ROUTE_ROLE_MAP)) {
    if (normalised.startsWith(prefix)) return [...roles] as UserRole[]
  }
  return null
}

/**
 * The default redirect path after a successful login, keyed by role.
 */
export const POST_LOGIN_REDIRECT: Record<string, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  staff: "/dashboard",
  customer: "/",
}

/**
 * Default session shape used to initialise an empty / unauthenticated session.
 */
export const DEFAULT_SESSION: SessionData = {
  isLoggedIn: false,
  user: null,
  tokens: null,
}
