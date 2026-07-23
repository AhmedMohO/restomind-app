/**
 * Core authentication and authorization types.
 * These are the single source of truth for all auth-related shapes.
 */

/** Roles supported by the RestoMind system */
export type UserRole = "admin" | "manager" | "customer" | "staff"

/**
 * The user object stored inside the encrypted Iron Session.
 * Mirrors the relevant fields from the API's User schema.
 */
export interface SessionUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isEmailVerified: boolean
  /** ObjectId of the restaurant this user manages (managers/admins only). */
  restaurantId?: string
}

/**
 * JWT tokens stored server-side only, inside the encrypted session.
 * Never exposed to the browser.
 */
export interface SessionTokens {
  accessToken: string
  refreshToken: string
  /** Unix timestamp (ms) when the access token expires */
  expiresAt: number
}

/**
 * The full shape of an Iron Session.
 * The session is encrypted with @hapi/iron and stored as an HttpOnly cookie.
 */
export interface SessionData {
  isLoggedIn: boolean
  user: SessionUser | null
  tokens: SessionTokens | null
}

/**
 * Standard success response envelope returned from our Route Handlers.
 */
export interface ApiSuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

/**
 * Standard error response envelope returned from our Route Handlers.
 */
export interface ApiError {
  success: false
  error: string
  message: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ---------------------------------------------------------------------------
// Upstream backend response shapes (external REST API)
// ---------------------------------------------------------------------------

/** Response shape from POST {API_URL}/auth/login */
export interface LoginApiPayload {
  accessToken: string
  refreshToken: string
}

/** Response shape from GET {API_URL}/auth/me */
export interface MeApiUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  isEmailVerified: boolean
  /** ObjectId of the restaurant this user manages (managers only, set by backend). */
  restaurantId?: string
}

/**
 * Loosely-typed envelope the backend uses for success/error bodies.
 * `message` may be a single string, an array of strings, or omitted.
 */
export interface BackendResponseBody {
  message?: string | string[]
  [key: string]: unknown
}
