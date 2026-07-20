# Production Authentication System Implementation Specification

## Objective

Implement a complete production-grade authentication and authorization system for a Next.js 15 App Router application using TypeScript.

The application authenticates against an external REST API.

Next.js acts as a Backend For Frontend (BFF).

The browser must NEVER receive or store JWT access tokens or refresh tokens in JavaScript.

The authentication system must be centralized, reusable, scalable, type-safe, and production ready.

---

# Tech Stack

- Next.js 15 App Router
- TypeScript
- Server Components
- Server Actions
- Route Handlers
- Iron Session
- Fetch API
- Zod for validation
- External REST API

---

# Authentication Flow

Login

Browser

↓

POST /api/auth/login

↓

Next.js Route Handler

↓

External API /auth/login

↓

Returns:

- accessToken
- refreshToken
- expiresIn
- user

↓

Next.js stores encrypted session using Iron Session

↓

Browser receives only encrypted HttpOnly cookie

The browser must never receive raw JWT tokens.

---

# Session Structure

Create typed session interfaces.

```ts
User

id

email

role

permissions (optional)

Tokens

accessToken

refreshToken

expiresAt

SessionData

isLoggedIn

user

tokens
```

The session should be fully typed.

---

# Cookie Configuration

Configure Iron Session using:

- httpOnly = true
- secure = production only
- sameSite = lax
- path = "/"

Cookie name:

session

Environment variables:

SESSION_SECRET

API_URL

---

# Folder Structure

app/

api/

auth/

login/

logout/

refresh/

lib/

auth/

session.ts

auth.ts

refresh.ts

permissions.ts

api/

client.ts

users.ts

products.ts

orders.ts

middleware/

guards.ts

types/

auth.ts

schemas/

login.ts

middleware.ts

---

# Login Route

Implement

POST /api/auth/login

Responsibilities

Validate request using Zod

Forward request to external API

Handle backend errors

Create session

Store

user

accessToken

refreshToken

expiresAt

Save encrypted session

Return success

Never return tokens to browser

---

# Logout Route

Destroy Iron Session

Optionally notify backend logout endpoint

Redirect to signin

---

# Refresh Route

Implement refreshSession()

Responsibilities

Read session

Verify refresh token exists

Call backend refresh endpoint

Update access token

Update refresh token

Update expiration

Save session

Destroy session if refresh fails

Throw AuthenticationError on failure

---

# API Client

Create reusable apiClient()

All server communication must use this client.

Responsibilities

Read session

Verify authentication

Attach Authorization Bearer token

Automatically refresh token before expiration

Retry request once after refresh

Return Response

Never expose tokens

Support all RequestInit options

Should behave like fetch()

---

# Refresh Buffer

Refresh access token before expiration.

Use configurable refresh buffer.

Example

60 seconds before expiration.

Never wait until exact expiration.

---

# Refresh Lock

Prevent multiple simultaneous refresh requests.

Implement refresh locking.

Only one refresh request may execute at once.

Other requests should await the same Promise.

Prevent refresh storms.

Release lock using finally.

Document limitations regarding multi-instance deployments.

---

# Error Classes

Create custom errors.

AuthenticationError

AuthorizationError

RefreshTokenExpiredError

ApiError

ValidationError

Avoid generic Error.

---

# API Wrapper

Create reusable wrappers.

Example

users.ts

products.ts

orders.ts

Each wrapper should use apiClient internally.

Pages should never call fetch directly.

---

# Server Components

Server Components should simply call

getProducts()

getCurrentUser()

getOrders()

No authentication logic inside pages.

---

# Server Actions

Server Actions must use apiClient.

No duplicated token handling.

No duplicated refresh logic.

---

# Route Protection

Implement middleware.

Responsibilities

Read encrypted session

Check login

Redirect unauthenticated users

Allow public routes

Never refresh token inside middleware

Middleware should remain lightweight.

---

# Authorization

Support RBAC.

Roles

admin

manager

user

guest

Create helpers

requireAuth()

requireRole()

requirePermission()

Pages should use reusable authorization helpers.

---

# Current User Helper

Create getCurrentUser()

Reads session

Returns typed user

Returns null if unauthenticated

No duplicated code.

---

# Token Expiration

Store expiresAt.

Never decode JWT.

Never depend on JWT exp claim.

Use expiresIn returned from backend.

---

# Session Utilities

Create reusable helpers.

getSession()

saveSession()

destroySession()

updateTokens()

isAuthenticated()

isTokenExpired()

shouldRefresh()

---

# Security

Never expose tokens to JavaScript.

Never store tokens in localStorage.

Never store tokens in sessionStorage.

Never expose tokens through React state.

Never expose tokens in JSON responses.

Never expose tokens through Server Components.

Use HttpOnly encrypted cookies only.

---

# Logging

Implement structured logging.

Log

login

logout

refresh

refresh failure

authorization failure

Never log JWT tokens.

Never log refresh tokens.

---

# Validation

Validate all incoming Route Handler payloads using Zod.

Never trust request.json() directly.

Return consistent validation errors.

---

# Response Format

Implement consistent API responses.

Success

{
success,
data,
message
}

Error

{
success,
error,
message
}

---

# Type Safety

No any.

No unknown casts.

Strong typing throughout.

Create reusable interfaces.

---

# Concurrency

Document concurrent refresh behavior.

Prevent duplicate refreshes.

Retry original request exactly once.

Never create infinite retry loops.

---

# Configuration

Centralize configuration.

Refresh buffer

Cookie name

API URL

Session options

Public routes

Protected routes

---

# Production Requirements

No duplicated authentication logic.

No duplicated refresh logic.

No duplicated authorization logic.

Single source of truth.

Reusable utilities.

Maintainable architecture.

SOLID principles.

Separation of concerns.

Clean architecture.

Dependency inversion where appropriate.

---

# Testing Checklist

Verify

Login

Logout

Session persistence

Session destruction

Access token refresh

Refresh rotation

Expired refresh token

Concurrent requests

Protected routes

Public routes

Role authorization

Permission authorization

Server Components

Server Actions

API wrappers

Middleware redirects

Validation failures

Network failures

Backend 401

Backend 403

Backend 500

Retry behavior

Cookie encryption

Cookie flags

---

# Deliverables

Generate the implementation incrementally.

For each file:

1. Explain its purpose.
2. Generate the complete code.
3. Explain every exported function.
4. Explain why the design decisions were made.
5. Do not skip implementation details.
6. Continue until the complete authentication system is finished.

Do not use placeholders or TODOs unless absolutely unavoidable. Produce production-quality code throughout.
