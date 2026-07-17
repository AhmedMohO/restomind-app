"use server"

/**
 * Login & Logout Server Actions.
 *
 * Called by client forms (e.g. LoginForm, Navbar).
 * Handles token fetching from backend API and persists the encrypted
 * Iron Session cookie. The encrypted `session` cookie is the single
 * source of truth for authentication — no auxiliary indicator cookies
 * are written.
 *
 * Note: tokens NEVER leave the server; only the encrypted session cookie
 * is set via next/headers cookies().
 */

import { z } from "zod"
import { loginSchema, type LoginInput } from "@/schemas/login"
import { getSession, computeExpiresAt } from "@/lib/auth/session"
import { API_URL } from "@/lib/auth/config"
import { extractApiMessage } from "@/lib/api/utils"
import type { SessionUser, LoginApiPayload, MeApiUser } from "@/features/auth/auth"

export interface LoginResult {
  success: boolean
  user?: SessionUser
  message?: string
  error?: string
}

export async function loginAction(
  credentials: LoginInput
): Promise<LoginResult> {
  try {
    // 1. Validate request input
    const result = loginSchema.safeParse(credentials)
    if (!result.success) {
      const errorTree = z.treeifyError(result.error)
      const fieldErrors = errorTree.properties
        ? Object.values(errorTree.properties).flatMap((prop) => prop?.errors ?? [])
        : []
      const allErrors = [...errorTree.errors, ...fieldErrors]
      return {
        success: false,
        error: "Validation Error",
        message: allErrors.join(", "),
      }
    }

    const { email, password } = result.data

    // 2. Call external API login endpoint
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })

    if (!loginResponse.ok) {
      const errorBody = await loginResponse.json().catch(() => ({}))
      return {
        success: false,
        error: "Authentication Failed",
        message: extractApiMessage(errorBody, "Login failed"),
      }
    }

    const { accessToken, refreshToken } =
      (await loginResponse.json()) as LoginApiPayload

    // 3. Fetch user profile using access token
    const meResponse = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (!meResponse.ok) {
      return {
        success: false,
        error: "Internal Error",
        message: "Login succeeded but failed to load user profile",
      }
    }

    const apiUser = (await meResponse.json()) as MeApiUser

    const user: SessionUser = {
      _id: apiUser._id,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      email: apiUser.email,
      role: apiUser.role,
      isEmailVerified: apiUser.isEmailVerified,
    }

    // 4. Store session in encrypted Iron Session cookie (server-only)
    const session = await getSession()
    session.isLoggedIn = true
    session.user = user
    session.tokens = {
      accessToken,
      refreshToken,
      expiresAt: computeExpiresAt(),
    }
    await session.save()

    console.info("[loginAction] User logged in", {
      userId: user._id,
      role: user.role,
    })

    return {
      success: true,
      user,
      message: "Logged in successfully",
    }
  } catch (error) {
    console.error("[loginAction] Unexpected error", error)
    return {
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred during login",
    }
  }
}

// ---------------------------------------------------------------------------
// Logout Server Action
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  try {
    const session = await getSession()
    const accessToken = session.tokens?.accessToken
    const userId = session.user?._id

    // Best-effort: tell the backend to blacklist this access token
    if (accessToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })
      } catch (err) {
        console.warn("[logoutAction] Backend logout failed (non-fatal)", err)
      }
    }

    // Destroy local encrypted Iron Session — single source of truth cleanup
    session.destroy()

    console.info("[logoutAction] User logged out", { userId })
  } catch (error) {
    console.error("[logoutAction] Unexpected error", error)
  }
}
