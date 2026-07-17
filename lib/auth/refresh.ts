/**
 * Token refresh logic — server-only.
 *
 * Uses a module-level lock (Promise) to prevent concurrent refresh storms.
 * Only one refresh request can be in-flight at a time; all others await the
 * same promise.
 *
 * ⚠️  Multi-instance limitation:
 * This lock lives in Node.js process memory. In a horizontally-scaled
 * deployment (multiple instances / serverless workers), two instances can
 * independently refresh simultaneously. This is safe (both will succeed and
 * write the new token), but results in one redundant API call.
 * A Redis-based distributed lock would be needed to eliminate this entirely.
 *
 * The API refresh endpoint is POST /auth/generate-access-token with the
 * refresh token in the Authorization header. It returns { accessToken } only —
 * no new refresh token (no rotation).
 */

import "server-only"

import { API_URL } from "./config"
import { AuthenticationError, RefreshTokenExpiredError } from "./errors"
import {
  getSession,
  updateTokens,
  destroySession,
  computeExpiresAt,
} from "./session"

// ---------------------------------------------------------------------------
// Refresh lock
// ---------------------------------------------------------------------------

let refreshLock: Promise<void> | null = null

// ---------------------------------------------------------------------------
// refreshSession
// ---------------------------------------------------------------------------

/**
 * Attempts to exchange the stored refresh token for a new access token.
 *
 * - Acquires a module-level lock to serialise concurrent refresh calls.
 * - Updates only the accessToken + expiresAt (no rotation from this API).
 * - Destroys the session and throws if the refresh fails.
 *
 * @throws {RefreshTokenExpiredError} if the backend rejects the refresh token
 * @throws {AuthenticationError} if there is no session or no refresh token
 */
export async function refreshSession(): Promise<void> {
  // If a refresh is already in-flight, wait for it rather than making a second
  if (refreshLock !== null) {
    await refreshLock
    return
  }

  let resolve!: () => void
  let reject!: (err: unknown) => void

  refreshLock = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  try {
    const session = await getSession()

    if (!session.isLoggedIn || !session.tokens?.refreshToken) {
      throw new AuthenticationError("No refresh token available")
    }

    const { refreshToken } = session.tokens

    console.info("[auth] Refreshing access token")

    const response = await fetch(`${API_URL}/auth/generate-access-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string
      }
      console.error("[auth] Refresh failed", { status: response.status, body })

      // Destroy the session so the user is logged out cleanly
      await destroySession(session)

      if (response.status === 401) {
        throw new RefreshTokenExpiredError()
      }

      throw new AuthenticationError(
        body.message ?? "Failed to refresh access token"
      )
    }

    const data = (await response.json()) as { accessToken?: string }

    if (!data.accessToken) {
      await destroySession(session)
      throw new AuthenticationError("Invalid refresh response from server")
    }

    // Preserve the existing refresh token (no rotation from this API)
    await updateTokens(session, {
      accessToken: data.accessToken,
      refreshToken: session.tokens.refreshToken,
      expiresAt: computeExpiresAt(),
    })

    console.info("[auth] Access token refreshed successfully")
    resolve()
  } catch (error) {
    reject(error)
    throw error
  } finally {
    // Always release the lock regardless of success or failure
    refreshLock = null
  }
}
