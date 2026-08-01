"use server"

/**
 * Auth Server Actions.
 *
 * Thin wrappers around the external REST API for operations that
 * don't need to touch the Iron Session (register, OTP confirm, etc.).
 * Login/logout are handled separately in features/auth/actions/login.ts.
 */

import { API_URL } from "@/lib/auth/config"
import { extractApiMessage } from "@/lib/api/utils"
import type { BackendResponseBody } from "@/features/auth/auth"

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildHeaders(): HeadersInit {
  return { "Content-Type": "application/json" }
}

export interface ActionResult<T = undefined> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export async function registerAction(
  payload: RegisterPayload
): Promise<ActionResult<{ email: string }>> {
  try {
    const response = await fetch(`${API_URL}/auth/signUp`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as {
      _id?: string
      email?: string
    } & BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Registration Failed",
        message: extractApiMessage(body, "Registration failed"),
      }
    }

    return {
      success: true,
      data: { email: body.email ?? payload.email },
      message: "Account created! Please check your email for the OTP code.",
    }
  } catch (error) {
    console.error("[registerAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

// ---------------------------------------------------------------------------
// Confirm Email (OTP verification)
// ---------------------------------------------------------------------------

export async function confirmEmailAction(
  email: string,
  otp: string
): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/confirm-email`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify({ email, otp }),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Verification Failed",
        message: extractApiMessage(body, "OTP verification failed"),
      }
    }

    return { success: true, message: "Email confirmed successfully!" }
  } catch (error) {
    console.error("[confirmEmailAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

// ---------------------------------------------------------------------------
// Send / Resend OTP
// ---------------------------------------------------------------------------

export type OtpType = "confirmation" | "reset-password"

export async function sendOtpAction(
  email: string,
  type: OtpType
): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email, type }),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Send OTP Failed",
        message: extractApiMessage(body, "Failed to send OTP"),
      }
    }

    return { success: true, message: "OTP sent to your email address." }
  } catch (error) {
    console.error("[sendOtpAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

// ---------------------------------------------------------------------------
// Forgot Password & Reset Password Flow
// ---------------------------------------------------------------------------

export async function forgotPasswordAction(email: string): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email }),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Failed",
        message: extractApiMessage(body, "Failed to send reset OTP"),
      }
    }

    return { success: true, message: "Password reset OTP sent to your email." }
  } catch (error) {
    console.error("[forgotPasswordAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

export async function confirmResetOtpAction(
  email: string,
  otp: string
): Promise<ActionResult<{ resetToken: string }>> {
  try {
    const response = await fetch(`${API_URL}/auth/confirm-reset-otp`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify({ email, otp }),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as {
      resetToken?: string
    } & BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Verification Failed",
        message: extractApiMessage(body, "OTP verification failed"),
      }
    }

    if (!body.resetToken) {
      return {
        success: false,
        error: "Verification Failed",
        message: "Reset token missing from server response",
      }
    }

    return {
      success: true,
      data: { resetToken: body.resetToken },
      message: "OTP verified successfully!",
    }
  } catch (error) {
    console.error("[confirmResetOtpAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

export async function resetPasswordAction(
  payload: { password: string; confirmPassword: string },
  resetToken: string
): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "PATCH",
      headers: {
        ...buildHeaders(),
        Authorization: `Bearer ${resetToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Reset Failed",
        message: extractApiMessage(body, "Password reset failed"),
      }
    }

    return { success: true, message: "Password reset successfully!" }
  } catch (error) {
    console.error("[resetPasswordAction]", error)
    return { success: false, error: "Network Error", message: "Unable to connect to the server." }
  }
}

// ---------------------------------------------------------------------------
// Setup Account (Partner manager setup after approval)
// ---------------------------------------------------------------------------

export async function setupAccountAction(payload: {
  token: string
  password: string
}): Promise<ActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/setup-account`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const body = (await response.json().catch(() => ({}))) as BackendResponseBody

    if (!response.ok) {
      return {
        success: false,
        error: "Setup Failed",
        message: extractApiMessage(body, "Account setup failed"),
      }
    }

    return {
      success: true,
      message: extractApiMessage(
        body,
        "Account password setup completed successfully. You can now log in."
      ),
    }
  } catch (error) {
    console.error("[setupAccountAction]", error)
    return {
      success: false,
      error: "Network Error",
      message: "Unable to connect to the server.",
    }
  }
}

