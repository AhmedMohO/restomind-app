/**
 * Shared helpers for talking to the external REST API.
 *
 * The backend returns `message` as either a single string, an array of
 * strings, or omitted. `extractApiMessage` normalises any of these into a
 * single human-readable string so callers don't repeat the same
 * `typeof body.message === "string" ? ...` pattern.
 */

import type { BackendResponseBody } from "@/features/auth/auth"
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
  if (!body || typeof body !== "object") return fallback

  const { message } = body as BackendResponseBody

  if (typeof message === "string" && message.length > 0) return message
  if (Array.isArray(message) && message.length > 0) return message.join(", ")

  return fallback
}

/**
 * Parses JSON response or throws an ApiError with extracted message.
 */
export async function parseOrThrow<T>(
  response: Response,
  context: string
): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as unknown
    const message = extractApiMessage(body, `${context} failed`)
    throw new ApiError(response.status, message)
  }
  return response.json() as Promise<T>
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
    if (typeof record.message === "string" && record.message.trim().length > 0) {
      return record.message
    }
    if (Array.isArray(record.message) && record.message.length > 0) {
      return record.message.join(", ")
    }
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}


