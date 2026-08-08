"use client"

import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { useZodResolver } from "@/lib/zod-locale"
import { useTranslations } from "next-intl"
import {
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"

import {
  forgotPasswordSchema,
  otpSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type OtpInput,
  type ResetPasswordInput,
} from "@/schemas/auth"
import {
  forgotPasswordAction,
  confirmResetOtpAction,
  resetPasswordAction,
  sendOtpAction,
} from "@/features/auth/actions/auth"
import { Link, useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

type Step = "email" | "otp" | "reset"

export function ForgotPasswordForm() {
  const t = useTranslations("Auth")
  const router = useRouter()

  const [step, setStep] = useState<Step>("email")
  const [targetEmail, setTargetEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Step 1: Email Form
  const emailForm = useForm<ForgotPasswordInput>({
    resolver: useZodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  // Step 2: OTP Form
  const otpForm = useForm<OtpInput>({
    resolver: useZodResolver(otpSchema),
    defaultValues: { email: "", otp: "" },
  })

  const otpValue = useWatch({ control: otpForm.control, name: "otp" }) ?? ""

  // Step 3: New Password Form
  const resetForm = useForm<ResetPasswordInput>({
    resolver: useZodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  useEffect(() => {
    return () => {
      emailForm.reset({ email: "" })
      otpForm.reset({ email: "", otp: "" })
      resetForm.reset({ password: "", confirmPassword: "" })
      setStep("email")
      setTargetEmail("")
      setResetToken("")
      setServerError(null)
      setServerSuccess(null)
    }
  }, [emailForm, otpForm, resetForm])

  function startResendCooldown(seconds = 60) {
    setResendCooldown(seconds)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle Step 1 Submit
  async function onEmailSubmit(data: ForgotPasswordInput) {
    setServerError(null)
    const result = await forgotPasswordAction(data.email)

    if (!result.success) {
      const msg = result.message ?? "Failed to send reset OTP"
      setServerError(msg)
      toast.error(msg)
      return
    }

    setTargetEmail(data.email)
    otpForm.setValue("email", data.email, { shouldValidate: true })
    const successMsg = result.message ?? "Reset code sent to your email"
    setServerSuccess(successMsg)
    toast.success(successMsg)
    setStep("otp")
    startResendCooldown()
  }

  // Handle Step 2 Submit (Verify OTP)
  async function onOtpSubmit(data: OtpInput) {
    setServerError(null)
    const result = await confirmResetOtpAction(
      data.email || targetEmail,
      data.otp
    )

    if (!result.success || !result.data?.resetToken) {
      const msg = result.message ?? "Invalid or expired OTP"
      setServerError(msg)
      toast.error(msg)
      return
    }

    setResetToken(result.data.resetToken)
    setServerSuccess(null)
    toast.success(t("codeVerified"))
    setStep("reset")
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setServerError(null)

    const result = await sendOtpAction(targetEmail, "reset-password")
    setIsResending(false)

    if (!result.success) {
      const msg = result.message ?? "Failed to resend OTP"
      setServerError(msg)
      toast.error(msg)
      return
    }

    const msg = "A new reset code has been sent to your email."
    setServerSuccess(msg)
    toast.success(msg)
    startResendCooldown()
  }

  // Handle Step 3 Submit (Set New Password)
  async function onResetSubmit(data: ResetPasswordInput) {
    setServerError(null)
    const result = await resetPasswordAction(
      { password: data.password, confirmPassword: data.confirmPassword },
      resetToken
    )

    if (!result.success) {
      const msg = result.message ?? "Failed to reset password"
      setServerError(msg)
      toast.error(msg)
      return
    }

    const successMsg = t("resetPasswordSuccess")
    setServerSuccess(successMsg)
    toast.success(successMsg)

    setTimeout(() => {
      router.push("/login")
    }, 1500)
  }

  // -------------------------------------------------------------------------
  // Render Step 1: Email Request
  // -------------------------------------------------------------------------
  if (step === "email") {
    const { errors, isSubmitting } = emailForm.formState

    return (
      <form
        className="flex flex-col gap-6"
        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
        noValidate
        autoComplete="off"
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              {t("forgotPasswordTitle")}
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              {t("forgotPasswordDescription")}
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="fp-email">{t("emailLabel")}</FieldLabel>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              className="h-10 px-3 text-sm"
              {...emailForm.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field className="mt-2">
            <Button
              id="fp-submit"
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("forgotPasswordButton")}…
                </>
              ) : (
                t("forgotPasswordButton")
              )}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="flex justify-center text-sm">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 font-semibold text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
              >
                <ArrowLeft className="size-4 shrink-0 transition-transform rtl:rotate-180" />
                <span>{t("backToLogin")}</span>
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  // -------------------------------------------------------------------------
  // Render Step 2: OTP Verification
  // -------------------------------------------------------------------------
  if (step === "otp") {
    const { errors: otpErrors, isSubmitting: otpSubmitting } = otpForm.formState

    return (
      <form
        className="flex flex-col gap-6"
        onSubmit={otpForm.handleSubmit(onOtpSubmit)}
        noValidate
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="size-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              {t("otpTitle")}
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              {t("otpDescription")}{" "}
              <span className="font-semibold text-foreground">
                {targetEmail}
              </span>
            </p>
          </div>

          {serverSuccess && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-700 dark:text-green-400">
              {serverSuccess}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <Field data-invalid={!!otpErrors.otp}>
            <FieldLabel className="sr-only">{t("otpLabel")}</FieldLabel>
            <div dir="ltr" className="flex justify-center [direction:ltr]">
              <InputOTP
                id="fp-otp-input"
                maxLength={6}
                aria-invalid={!!otpErrors.otp}
                value={otpValue}
                onChange={(val) => {
                  otpForm.setValue("otp", val, { shouldValidate: true })
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="size-11 rounded-l-lg text-base first:rounded-l-lg last:rounded-none"
                  />
                  <InputOTPSlot index={1} className="size-11 text-base" />
                  <InputOTPSlot index={2} className="size-11 text-base" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="size-11 text-base" />
                  <InputOTPSlot index={4} className="size-11 text-base" />
                  <InputOTPSlot
                    index={5}
                    className="size-11 rounded-r-lg text-base last:rounded-r-lg"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <FieldError
              errors={[otpErrors.otp, otpErrors.email]}
              className="text-center"
            />
          </Field>

          <Field className="mt-1">
            <Button
              id="fp-otp-submit"
              type="submit"
              size="lg"
              disabled={otpSubmitting || otpValue.length < 6}
              className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {otpSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("verifyCodeButton")}…
                </>
              ) : (
                t("verifyCodeButton")
              )}
            </Button>
          </Field>

          <Field>
            <FieldDescription className="text-center text-sm">
              {t("otpNoCode")}{" "}
              <button
                type="button"
                disabled={resendCooldown > 0 || isResending}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                {resendCooldown > 0
                  ? t("otpResendIn", { seconds: resendCooldown })
                  : t("otpResend")}
              </button>
            </FieldDescription>
          </Field>

          <Field>
            <FieldDescription className="flex justify-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setServerError(null)
                  setServerSuccess(null)
                  otpForm.reset()
                }}
                className="inline-flex items-center justify-center gap-1.5 font-semibold text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
              >
                <ArrowLeft className="size-4 shrink-0 transition-transform rtl:rotate-180" />
                <span>{t("otpBack")}</span>
              </button>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  // -------------------------------------------------------------------------
  // Render Step 3: Reset Password (New Password & Confirm Password)
  // -------------------------------------------------------------------------
  const { errors: resetErrors, isSubmitting: resetSubmitting } =
    resetForm.formState

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={resetForm.handleSubmit(onResetSubmit)}
      noValidate
      autoComplete="off"
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="size-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {t("resetPasswordTitle")}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("resetPasswordDescription")}
          </p>
        </div>

        {serverSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {serverSuccess}
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <Field data-invalid={!!resetErrors.password}>
          <FieldLabel htmlFor="reset-password">{t("passwordLabel")}</FieldLabel>
          <div className="relative">
            <Input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!resetErrors.password}
              className="h-10 px-3 pe-10 text-sm"
              {...resetForm.register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <FieldError errors={[resetErrors.password]} />
        </Field>

        <Field data-invalid={!!resetErrors.confirmPassword}>
          <FieldLabel htmlFor="reset-confirmPassword">
            {t("confirmPasswordLabel")}
          </FieldLabel>
          <div className="relative">
            <Input
              id="reset-confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!resetErrors.confirmPassword}
              className="h-10 px-3 pe-10 text-sm"
              {...resetForm.register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <FieldError errors={[resetErrors.confirmPassword]} />
        </Field>

        <Field className="mt-2">
          <Button
            id="reset-submit"
            type="submit"
            size="lg"
            disabled={resetSubmitting}
            className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {resetSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("resetPasswordButton")}…
              </>
            ) : (
              t("resetPasswordButton")
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
