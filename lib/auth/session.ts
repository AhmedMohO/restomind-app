/**
 * Iron Session utilities — server-only.
 *
 * All session reads and writes go through these helpers.
 * Pages and Server Actions never call getIronSession directly.
 *
 * Design decisions:
 * - `getSession()` always returns a fully-typed session object, never undefined.
 * - `saveSession()` / `destroySession()` are the only mutation points.
 * - Token-related utilities are co-located here so refresh.ts can import them.
 */

import "server-only"

import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

import type { SessionData, SessionTokens } from "@/features/auth/auth"
import {
  sessionOptions,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_BUFFER_MS,
} from "./config"

// ---------------------------------------------------------------------------
// Core session helpers
// ---------------------------------------------------------------------------

/**
 * Reads and decrypts the Iron Session from the request cookies.
 * Returns the default (unauthenticated) session shape if no cookie is present.
 */
export async function getSession(): Promise<ReturnType<typeof getIronSession<SessionData>>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Persists the current session data back to the encrypted cookie.
 * Must be called after any mutation (login, token update, etc.).
 *
 * Safe for Server Components (RSC): Next.js forbids cookie mutations during RSC render.
 * When called in RSC, cookie persistence is skipped and a warning is logged,
 * while in-memory session changes remain valid for the current request.
 */
export async function saveSession(
  session: Awaited<ReturnType<typeof getSession>>
): Promise<void> {
  try {
    await session.save()
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Cookies can only be modified in a Server Action or Route Handler"
      )
    ) {
      console.warn(
        "[session] Cookie persistence skipped during Server Component rendering. In-memory session updated for current request."
      )
      return
    }
    throw error
  }
}

/**
 * Destroys the session and clears the cookie.
 * Used on logout and when a refresh fails catastrophically.
 */
export async function destroySession(
  session: Awaited<ReturnType<typeof getSession>>
): Promise<void> {
  try {
    session.destroy()
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        "Cookies can only be modified in a Server Action or Route Handler"
      )
    ) {
      console.warn(
        "[session] Cookie destruction skipped during Server Component rendering."
      )
      return
    }
    throw error
  }
}

// ---------------------------------------------------------------------------
// Convenience writers
// ---------------------------------------------------------------------------

/**
 * Updates only the token fields inside an existing session and saves.
 * Called by the refresh logic without touching the user data.
 */
export async function updateTokens(
  session: Awaited<ReturnType<typeof getSession>>,
  tokens: SessionTokens
): Promise<void> {
  session.tokens = tokens
  await saveSession(session)
}

// ---------------------------------------------------------------------------
// Read helpers (no mutation)
// ---------------------------------------------------------------------------

/**
 * Returns true when the session has a valid isLoggedIn flag and user data.
 */
export function isAuthenticated(
  session: Awaited<ReturnType<typeof getSession>>
): boolean {
  return (
    session.isLoggedIn === true &&
    session.user !== null &&
    session.user !== undefined &&
    session.tokens !== null &&
    session.tokens !== undefined
  )
}

/**
 * Returns true when the stored access token is past its expiration timestamp.
 */
export function isTokenExpired(
  session: Awaited<ReturnType<typeof getSession>>
): boolean {
  if (!session.tokens) return true
  return Date.now() >= session.tokens.expiresAt
}

/**
 * Returns true when we should proactively refresh the access token.
 * This fires REFRESH_BUFFER_MS before the exact expiry to avoid race conditions.
 */
export function shouldRefresh(
  session: Awaited<ReturnType<typeof getSession>>
): boolean {
  if (!session.tokens) return false
  return Date.now() >= session.tokens.expiresAt - REFRESH_BUFFER_MS
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Computes an `expiresAt` timestamp from the current time + configured TTL.
 * Used during login (the API does not return expiresIn).
 */
export function computeExpiresAt(ttlMs = ACCESS_TOKEN_TTL_MS): number {
  return Date.now() + ttlMs
}
