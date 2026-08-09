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
  saveSession,
  updateTokens,
  destroySession,
  computeExpiresAt,
} from "./session"
import type { MeApiUser } from "@/features/auth/auth"

// ---------------------------------------------------------------------------
// Refresh lock
// ---------------------------------------------------------------------------

let refreshLock: Promise<string> | null = null

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
 * @param existingSession - Optional already-loaded session object
 * @returns The newly issued access token
 *
 * @throws {RefreshTokenExpiredError} if the backend rejects the refresh token
 * @throws {AuthenticationError} if there is no session or no refresh token
 */
export async function refreshSession(
  existingSession?: Awaited<ReturnType<typeof getSession>>
): Promise<string> {
  // If a refresh is already in-flight, wait for it rather than making a second
  if (refreshLock !== null) {
    return await refreshLock
  }

  let resolve!: (token: string) => void
  let reject!: (err: unknown) => void

  refreshLock = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  try {
    const session = existingSession ?? (await getSession())

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

    const data = (await response.json()) as {
      accessToken?: string
      refreshToken?: string
    }

    if (!data.accessToken) {
      await destroySession(session)
      throw new AuthenticationError("Invalid refresh response from server")
    }

    // Save both the new access token AND the new rotated refresh token from backend
    const newRefreshToken = data.refreshToken ?? session.tokens.refreshToken

    await updateTokens(session, {
      accessToken: data.accessToken,
      refreshToken: newRefreshToken,
      expiresAt: computeExpiresAt(),
    })

    // Re-validate the cached role/profile alongside the token — a role
    // change (e.g. demotion) must not persist past the next refresh cycle.
    // Non-fatal: if this call fails, the refresh itself still succeeded and
    // the user keeps their previous (possibly stale) role until the next
    // refresh attempt rather than being logged out over a transient error.
    try {
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
        cache: "no-store",
      })
      if (meResponse.ok) {
        const apiUser = (await meResponse.json()) as MeApiUser
        session.user = {
          _id: apiUser._id,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          email: apiUser.email,
          role: apiUser.role,
          isEmailVerified: apiUser.isEmailVerified,
          restaurantId: apiUser.restaurantId,
        }
        await saveSession(session)
      }
    } catch (err) {
      console.warn("[auth] Role revalidation on refresh failed (non-fatal)", err)
    }

    console.info("[auth] Access token refreshed successfully")
    resolve(data.accessToken)
    return data.accessToken
  } catch (error) {
    reject(error)
    throw error
  } finally {
    // Always release the lock regardless of success or failure
    refreshLock = null
  }
}
