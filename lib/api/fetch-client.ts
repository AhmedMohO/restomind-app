/**
 * Client-side authenticated fetch wrapper.
 *
 * This is the browser-side mirror of the server `apiClient()` in
 * `@/lib/api/client.ts`. It calls the BFF route handlers under `/api`
 * (which themselves proxy to the external REST API) and transparently
 * refreshes the access token on a 401 using a single-flight queue.
 *
 * Why not refresh via the proxy middleware here? The proxy auto-refreshes
 * on document navigations only — client `fetch()` calls don't trigger
 * middleware. This wrapper implements the same defensive refresh pattern
 * as the server `apiClient()`: on 401 → POST /api/auth/refresh once, then
 * replay the original request. If refresh fails (e.g. refresh token
 * expired), the user is redirected to /login.
 *
 * Returns the success envelope's `data` field on success, or throws
 * `ClientFetchError` (carrying status / server error code) on non-2xx.
 */

type Json = Record<string, unknown> | unknown[]

type JsonObject = Json | BodyInit | null | undefined

/** Options for clientFetch. `body` accepts JSON-able values or BodyInit. */
export interface ClientFetchInit extends Omit<RequestInit, "body"> {
  body?: JsonObject
  _retry?: boolean
}

function isBodyInit(v: unknown): v is BodyInit {
  return (
    typeof v === "string" ||
    v instanceof FormData ||
    v instanceof Blob ||
    v instanceof URLSearchParams ||
    v instanceof ArrayBuffer ||
    v instanceof ReadableStream
  )
}

export class ClientFetchError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ClientFetchError"
    this.status = status
    this.code = code
  }
}

// --- Single-flight 401 refresh queue ----------------------------------------

let isRefreshing = false
let failedQueue: Array<{
  resolve: () => void
  reject: (err: unknown) => void
}> = []

function processQueue(err: unknown = null): void {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve()))
  failedQueue = []
}

async function refreshToken(): Promise<void> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    throw new ClientFetchError("Refresh token expired", res.status, "REFRESH_FAILED")
  }
}

// --- Public API ------------------------------------------------------------

interface ApiSuccessShape<T> {
  success: true
  data?: T
  message?: string
}

interface ApiErrorShape {
  success: false
  error: string
  message: string
}

type ApiResponse<T> = ApiSuccessShape<T> | ApiErrorShape

/**
 * Makes an authenticated client-side request to the BFF `/api` route.
 *
 * @param path     Path under `/api` (e.g. "/restaurant/me")
 * @param init     Options. `body` is JSON-stringified if it's a plain
 *                 object/array.
 * @returns        The success envelope's `data` field, or throws
 *                 `ClientFetchError` on non-2xx / `success: false` bodies.
 *                 Returns `undefined` when the server omitted `data`.
 */
export async function clientFetch<T = unknown>(
  path: string,
  init?: ClientFetchInit
): Promise<T | undefined> {
  const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? "" : "/"}${path}`

  const headers = new Headers(init?.headers)
  const rawBody = init?.body
  const isObjectBody = !isBodyInit(rawBody) && rawBody != null
  if (!headers.has("Content-Type") && isObjectBody) {
    headers.set("Content-Type", "application/json")
  }
  const finalBody =
    rawBody == null
      ? null
      : isBodyInit(rawBody)
        ? rawBody
        : JSON.stringify(rawBody)

  const finalInit: RequestInit = {
    method: init?.method,
    signal: init?.signal,
    credentials: "include",
    headers,
    body: finalBody,
  }

  const response = await fetch(url, finalInit)

  // Defensive 401 handling: refresh once, replay the original request.
  if (response.status === 401 && !init?._retry) {
    if (isRefreshing) {
      await new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
      return clientFetch<T>(url, { ...init, _retry: true })
    }

    isRefreshing = true
    try {
      await refreshToken()
      processQueue(null)
      return clientFetch<T>(url, { ...init, _retry: true })
    } catch (refreshErr) {
      processQueue(refreshErr)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw refreshErr
    } finally {
      isRefreshing = false
    }
  }

  let body: ApiResponse<T>
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    throw new ClientFetchError("Invalid JSON response", response.status)
  }

  if (!response.ok || body.success === false) {
    const errorBody = body as ApiErrorShape
    const rawMsg = (errorBody as unknown as Record<string, unknown>).message
    const message =
      typeof rawMsg === "string" && rawMsg.length > 0
        ? rawMsg
        : Array.isArray(rawMsg) && rawMsg.length > 0
          ? rawMsg.join(", ")
          : `Request failed (${response.status})`
    const code = errorBody.error
    throw new ClientFetchError(message, response.status, code)
  }

  return (body as ApiSuccessShape<T>).data
}
