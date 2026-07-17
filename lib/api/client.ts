/**
 * Authenticated API client — server-only.
 *
 * All outbound HTTP calls to the external REST API must go through
 * `apiClient()`. It handles:
 *
 * 1. Reading the current Iron Session
 * 2. Proactively refreshing the access token when within the buffer window
 * 3. Attaching the Authorization Bearer header
 * 4. Making the fetch call
 * 5. Retrying exactly once if the backend returns 401 (defensive refresh)
 *
 * Pages and Server Actions import domain-specific wrappers (users.ts,
 * products.ts, orders.ts) which call apiClient internally.
 * They should never call fetch() or apiClient() directly.
 *
 * Design:
 * - Behaves like the native fetch() API — returns a Response.
 * - Never exposes tokens in return values or logs.
 * - Retry is capped at one attempt to prevent infinite loops.
 */

import "server-only"

import {
  getSession,
  isAuthenticated,
  shouldRefresh,
} from "@/lib/auth/session"
import { refreshSession } from "@/lib/auth/refresh"
import { AuthenticationError } from "@/lib/auth/errors"
import { API_URL } from "@/lib/auth/config"

/**
 * Makes an authenticated request to the external API.
 *
 * @param path  - The API path (e.g. "/users", "/products/123")
 * @param init  - Standard RequestInit options (method, body, headers, …)
 * @param isRetry - Internal flag; prevents recursive retries
 * @returns The raw Response from the API
 *
 * @throws {AuthenticationError} if there is no valid session
 */
export async function apiClient(
  path: string,
  init?: RequestInit,
  isRetry = false
): Promise<Response> {
  const session = await getSession()

  if (!isAuthenticated(session)) {
    throw new AuthenticationError("You must be logged in to access this resource")
  }

  // Proactively refresh if within the buffer window
  if (shouldRefresh(session)) {
    await refreshSession()
    // Re-read the session to get the updated access token
    const freshSession = await getSession()
    return makeRequest(freshSession.tokens!.accessToken, path, init)
  }

  const response = await makeRequest(session.tokens!.accessToken, path, init)

  // Defensive 401 handling: refresh once and retry
  if (response.status === 401 && !isRetry) {
    console.warn("[api-client] Got 401, attempting token refresh and retry")
    await refreshSession()
    const freshSession = await getSession()
    return makeRequest(freshSession.tokens!.accessToken, path, init, true)
  }

  return response
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function makeRequest(
  accessToken: string,
  path: string,
  init?: RequestInit,
  retry = false
): Promise<Response> {
  const url = `${API_URL}${path}`

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)

  // Default Content-Type for JSON requests
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })
}

// ---------------------------------------------------------------------------
// Public API — unauthenticated fetch (for public endpoints)
// ---------------------------------------------------------------------------

/**
 * Makes an unauthenticated request to the external API.
 * Use this for public endpoints like GET /products, GET /categories.
 */
export async function publicApiClient(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${API_URL}${path}`

  const headers = new Headers(init?.headers)

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  })
}
