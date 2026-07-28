/**
 * Shared helpers for talking to the external REST API.
 *
 * The backend returns `message` as either a single string, an array of
 * strings, or omitted. `extractApiMessage` normalises any of these into a
 * single human-readable string so callers don't repeat the same
 * `typeof body.message === "string" ? ...` pattern.
 */

import { ApiError } from "@/lib/auth/errors"

/**
 * Extracts a human-readable message from a backend response body.
 *
 * @param body      The parsed JSON body (may be partial/unknown shape).
 * @param fallback  Returned when the body has no `message` field.
 * @returns A single, non-empty string.
 */
export function extractApiMessage(
  body: unknown,
  fallback: string
): string {
  return getErrorMessage(body, fallback)
}

/**
 * Parses JSON response or throws an ApiError with extracted message.
 */
export async function parseOrThrow<T>(
  response: Response,
  context: string
): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as unknown
  if (!response.ok || (typeof body === "object" && body !== null && (body as { success?: boolean }).success === false)) {
    const message = extractApiMessage(body, `${context} failed`)
    throw new ApiError(response.status, message)
  }
  return body as T
}

/**
 * Builds a query string from key-value parameters.
 * Omits undefined, null, or empty string values.
 */
export function buildQueryString<T extends object>(
  params: T
): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value))
    }
  }
  const str = qs.toString()
  return str ? `?${str}` : ""
}

export function getErrorMessage(err: unknown, fallback: string = "An error occurred"): string {
  if (!err) return fallback
  if (typeof err === "string" && err.trim().length > 0) return err

  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>

    // Prefer message field (string or array)
    if (typeof record.message === "string" && record.message.trim().length > 0) {
      return record.message
    }
    if (Array.isArray(record.message) && record.message.length > 0) {
      return record.message.join(", ")
    }

    // Fall back to error code only if it's a human-readable code, not a generic sentinel
    if (
      typeof record.error === "string" &&
      record.error.trim().length > 0 &&
      !["INTERNAL_ERROR", "BAD_REQUEST", "Unauthorized", "Forbidden", "NOT_FOUND"].includes(record.error)
    ) {
      return record.error
    }
  }

  return fallback
}
