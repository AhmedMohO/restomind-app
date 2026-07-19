/**
 * Zod validation schemas for authentication-related Route Handler payloads.
 *
 * Rule: Never trust request.json() directly.
 * Always validate through these schemas before using the data.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginInput = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Confirm email (OTP)
// ---------------------------------------------------------------------------

export const confirmEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d+$/, { message: "otpDigitsOnly" }),
})

export type ConfirmEmailInput = z.infer<typeof confirmEmailSchema>
