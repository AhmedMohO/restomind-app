import { z } from "zod"

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    firstName: z.string().min(3).max(20),
    lastName: z.string().min(3).max(20),
    email: z.email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  })

export type RegisterInput = z.infer<typeof registerSchema>

// ---------------------------------------------------------------------------
// OTP confirm email
// ---------------------------------------------------------------------------

export const otpSchema = z.object({
  email: z.email(),
  otp: z.string().length(6).regex(/^\d+$/),
})

export type OtpInput = z.infer<typeof otpSchema>

// ---------------------------------------------------------------------------
// Send OTP (resend)
// ---------------------------------------------------------------------------

export const sendOtpSchema = z.object({
  email: z.email(),
  type: z.enum(["confirmation", "reset-password", "forgetPassword"]),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>

// ---------------------------------------------------------------------------
// Forgot password (request)
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  email: z.email(),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMismatch",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
