"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { useZodResolver } from "@/lib/zod-locale"
import { useTranslations } from "next-intl"
import { Eye, EyeOff, Loader2, MailCheck, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { registerSchema, type RegisterInput } from "@/schemas/auth"
import { otpSchema, type OtpInput } from "@/schemas/auth"
import {
  registerAction,
  confirmEmailAction,
  sendOtpAction,
} from "@/features/auth/actions/auth"
import { loginAction } from "@/features/auth/actions/login"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { useRouter } from "@/i18n/routing"
import { Link } from "@/i18n/routing"

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
  FieldSeparator,
} from "@/components/ui/field"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "register" | "otp"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RegisterFormContent({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const searchParams = useSearchParams()

  const paramEmail = searchParams.get("email") || ""
  const paramStep = searchParams.get("step")
  const paramResend = searchParams.get("resend") === "true"

  const [step, setStep] = useState<Step>(
    paramStep === "otp" && paramEmail ? "otp" : "register"
  )
  const [registeredEmail, setRegisteredEmail] = useState(paramEmail)
  const [registeredPassword, setRegisteredPassword] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  const autoResendRef = useRef(false)
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
  // -----------------------------------------------------------------------
  // Step 1 — Registration form
  // -----------------------------------------------------------------------
  const registerForm = useForm<RegisterInput>({
    resolver: useZodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: paramEmail,
      password: "",
      confirmPassword: "",
      phone: "",
    },
  })

  async function onRegisterSubmit(data: RegisterInput) {
    setServerError(null)

    const result = await registerAction({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    })

    if (!result.success) {
      const msg = result.message ?? "Registration failed"
      setServerError(msg)
      toast.error(msg)
      return
    }

    toast.success(result.message ?? t("verificationCodeSent"))
    setRegisteredEmail(data.email)
    setRegisteredPassword(data.password)
    setServerSuccess(result.message ?? null)
    otpForm.setValue("email", data.email, { shouldValidate: true })
    setStep("otp")
    startResendCooldown()
  }

  // -----------------------------------------------------------------------
  // Step 2 — OTP confirmation form
  // -----------------------------------------------------------------------
  const otpForm = useForm<OtpInput>({
    resolver: useZodResolver(otpSchema),
    defaultValues: { email: paramEmail, otp: "" },
  })

  const otpValue = useWatch({ control: otpForm.control, name: "otp" }) ?? ""

  // Sync searchParams step and email during render if needed
  if (paramStep === "otp" && paramEmail) {
    if (step !== "otp") setStep("otp")
    if (registeredEmail !== paramEmail) setRegisteredEmail(paramEmail)
  }

  useEffect(() => {
    if (paramStep === "otp" && paramEmail && paramResend && !autoResendRef.current) {
      autoResendRef.current = true
      setIsResending(true)
      sendOtpAction(paramEmail, "confirmation")
        .then((res) => {
          setIsResending(false)
          if (res.success) {
            const msg =
              res.message ??
              "A new verification code has been sent to your email."
            setServerSuccess(msg)
            toast.success(msg)
            startResendCooldown()
          } else {
            setServerError(res.message ?? "Failed to resend OTP")
          }
        })
        .catch(() => {
          setIsResending(false)
          setServerError("Failed to resend OTP")
        })
    }
  }, [paramStep, paramEmail, paramResend])

  async function onOtpSubmit(data: OtpInput) {
    setServerError(null)

    const confirmResult = await confirmEmailAction(registeredEmail, data.otp)

    if (!confirmResult.success) {
      const msg = confirmResult.message ?? "OTP verification failed"
      setServerError(msg)
      toast.error(msg)
      return
    }

    toast.success(t("accountVerified"))

    // Auto-login after successful email confirmation if password available
    if (registeredPassword) {
      const loginResult = await loginAction({
        email: registeredEmail,
        password: registeredPassword,
      })

      if (loginResult.success && loginResult.user) {
        setUser(loginResult.user)
        router.push("/")
        router.refresh()
        return
      }
    }

    router.push("/login")
  }

  // -----------------------------------------------------------------------
  // Resend OTP
  // ----------------------------------------------------------------------

  async function handleResendOtp() {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setServerError(null)

    const result = await sendOtpAction(registeredEmail, "confirmation")

    setIsResending(false)

    if (!result.success) {
      setServerError(result.message ?? "Failed to resend OTP")
      return
    }

    setServerSuccess("A new OTP has been sent to your email.")
    startResendCooldown()
  }

  // -----------------------------------------------------------------------
  // Render — Step 1: Register
  // -----------------------------------------------------------------------
  if (step === "register") {
    const {
      formState: { errors, isSubmitting },
    } = registerForm

    return (
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
        noValidate
        {...props}
      >
        <FieldGroup>
          {/* Heading */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
              {t("registerTitle")}
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              {t("registerDescription")}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="reg-firstName">
                {t("firstNameLabel")}
              </FieldLabel>
              <Input
                id="reg-firstName"
                type="text"
                autoComplete="given-name"
                placeholder={t("firstNamePlaceholder")}
                aria-invalid={!!errors.firstName}
                className="h-10 px-3 text-sm"
                {...registerForm.register("firstName")}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="reg-lastName">
                {t("lastNameLabel")}
              </FieldLabel>
              <Input
                id="reg-lastName"
                type="text"
                autoComplete="family-name"
                placeholder={t("lastNamePlaceholder")}
                aria-invalid={!!errors.lastName}
                className="h-10 px-3 text-sm"
                {...registerForm.register("lastName")}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>
          </div>

          {/* Email */}
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="reg-email">{t("emailLabel")}</FieldLabel>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={!!errors.email}
              className="h-10 px-3 text-sm"
              {...registerForm.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          {/* Password */}
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="reg-password">{t("passwordLabel")}</FieldLabel>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="h-10 px-3 pe-10 text-sm"
                {...registerForm.register("password")}
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
            <FieldError errors={[errors.password]} />
          </Field>

          {/* Confirm password */}
          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="reg-confirmPassword">
              {t("confirmPasswordLabel")}
            </FieldLabel>
            <div className="relative">
              <Input
                id="reg-confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                className="h-10 px-3 pe-10 text-sm"
                {...registerForm.register("confirmPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={
                  showConfirm
                    ? "Hide confirm password"
                    : "Show confirm password"
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
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          {/* Phone */}
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="reg-phone">{t("phoneLabel")} </FieldLabel>
            <Input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              className="h-10 px-3 text-sm"
              {...registerForm.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
          </Field>

          {/* Submit */}
          <Field className="mt-2">
            <Button
              id="register-submit"
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("registerButton")}…
                </>
              ) : (
                t("registerButton")
              )}
            </Button>
          </Field>

          <FieldSeparator>{t("orContinueWith")}</FieldSeparator>

          <Field>
            <FieldDescription className="text-center text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("signInLink")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  // -----------------------------------------------------------------------
  // Render — Step 2: OTP confirm
  // -----------------------------------------------------------------------
  const {
    formState: { errors: otpErrors, isSubmitting: otpSubmitting },
  } = otpForm

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={otpForm.handleSubmit(onOtpSubmit)}
      noValidate
    >
      <FieldGroup>
        {/* Heading */}
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
              {registeredEmail}
            </span>
          </p>
        </div>

        {/* Success toast */}
        {serverSuccess && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/8 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {serverSuccess}
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        {/* OTP input */}
        <Field data-invalid={!!otpErrors.otp}>
          <FieldLabel className="sr-only">{t("otpLabel")}</FieldLabel>
          <div dir="ltr" className="flex justify-center [direction:ltr]">
            <InputOTP
              id="otp-input"
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

        {/* Submit */}
        <Field className="mt-1">
          <Button
            id="otp-submit"
            type="submit"
            size="lg"
            disabled={otpSubmitting || otpValue.length < 6}
            className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {otpSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("otpButton")}…
              </>
            ) : (
              t("otpButton")
            )}
          </Button>
        </Field>

        {/* Resend */}
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

        {/* Back */}
        <Field>
          <FieldDescription className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("register")
                setServerError(null)
                setServerSuccess(null)
                otpForm.reset()
              }}
              className="font-semibold text-muted-foreground underline-offset-4 hover:underline"
            >
              ← {t("otpBack")}
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

export function RegisterForm(props: React.ComponentProps<"form">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RegisterFormContent {...props} />
    </Suspense>
  )
}
