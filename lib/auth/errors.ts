/**
 * Custom error hierarchy for the authentication system.
 *
 * Using typed error classes instead of generic Error objects enables:
 * - Precise catch clauses (`catch (e) { if (e instanceof AuthenticationError) ... }`)
 * - Structured logging with error codes
 * - Centralised HTTP status mapping in route handlers
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

/** Base class for all auth-system errors */
export abstract class AuthBaseError extends Error {
  abstract readonly statusCode: number

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    // Restore prototype chain (needed when transpiling to ES5)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

// ---------------------------------------------------------------------------
// Authentication (401)
// ---------------------------------------------------------------------------

/**
 * Thrown when a request cannot be authenticated.
 * Examples: no session, invalid session, blacklisted token.
 */
export class AuthenticationError extends AuthBaseError {
  readonly statusCode = 401

  constructor(message = "Authentication required", cause?: unknown) {
    super(message, cause)
  }
}

/**
 * Thrown specifically when the refresh token has expired or been rejected.
 * Extends AuthenticationError so callers can catch either.
 */
export class RefreshTokenExpiredError extends AuthenticationError {
  constructor(message = "Refresh token has expired. Please sign in again.") {
    super(message)
  }
}

// ---------------------------------------------------------------------------
// Authorization (403)
// ---------------------------------------------------------------------------

/**
 * Thrown when the user is authenticated but lacks the required role.
 */
export class AuthorizationError extends AuthBaseError {
  readonly statusCode = 403

  constructor(message = "You do not have permission to perform this action") {
    super(message)
  }
}

// ---------------------------------------------------------------------------
// API errors (upstream backend)
// ---------------------------------------------------------------------------

/**
 * Thrown when the external REST API responds with a non-2xx status code.
 * Wraps the backend's status code and error body.
 */
export class ApiError extends AuthBaseError {
  readonly statusCode: number

  constructor(
    public readonly upstreamStatus: number,
    message: string,
    cause?: unknown
  ) {
    super(message, cause)
    // Map upstream statuses to a sensible local HTTP status
    this.statusCode = upstreamStatus
  }
}

// ---------------------------------------------------------------------------
// Validation (422)
// ---------------------------------------------------------------------------

/**
 * Thrown when incoming request data fails Zod validation.
 */
export class ValidationError extends AuthBaseError {
  readonly statusCode = 422

  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message)
  }
}
