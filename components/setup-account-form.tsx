"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useZodResolver } from "@/lib/zod-locale"
import { useTranslations } from "next-intl"
import {
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { setupAccountSchema, type SetupAccountInput } from "@/schemas/auth"
import { setupAccountAction } from "@/features/auth/actions/auth"
import { useRouter, Link } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

function SetupAccountFormContent({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<SetupAccountInput>({
    resolver: useZodResolver(setupAccountSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  async function onSubmit(data: SetupAccountInput) {
    setServerError(null)
    setServerSuccess(null)

    if (!token) {
      const msg =
        t("missingTokenError") ||
        "Setup token is missing or invalid. Please check your setup link."
      setServerError(msg)
      toast.error(msg)
      return
    }

    const result = await setupAccountAction({
      token,
      password: data.password,
    })

    if (!result.success) {
      const msg =
        result.message || t("setupAccountError") || "Account setup failed."
      setServerError(msg)
      toast.error(msg)
      // IMPORTANT: DO NOT REDIRECT ON ERROR!
      return
    }

    const successMsg =
      result.message ||
      t("setupAccountSuccess") ||
      "Account password setup completed successfully. Redirecting to login..."
    setServerSuccess(successMsg)
    toast.success(successMsg)

    setTimeout(() => {
      router.push("/login")
    }, 1500)
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold">
            {t("invalidSetupTokenTitle") || "Invalid Setup Link"}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("invalidSetupTokenDescription") ||
              "This account setup link is missing a valid security token. Please check the link provided in your approval email or contact support."}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/login" />}
          variant="outline"
          className="mt-2 rounded-xl"
        >
          {t("backToLogin") || "Back to Login"}
        </Button>
      </div>
    )
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      {...props}
    >
      <FieldGroup>
        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            {t("setupAccountTitle") || "Activate Your Account"}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("setupAccountDescription") ||
              "Set your password to activate your restaurant manager account."}
          </p>
        </div>

        {/* Server Success */}
        {serverSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{serverSuccess}</span>
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Password */}
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="setup-password">
            {t("passwordLabel") || "New Password"}
          </FieldLabel>
          <div className="relative">
            <Input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="dir-ltr h-10 px-3 pe-10 text-sm"
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
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

        {/* Confirm Password */}
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="setup-confirmPassword">
            {t("confirmPasswordLabel") || "Confirm Password"}
          </FieldLabel>
          <div className="relative">
            <Input
              id="setup-confirmPassword"
              type={showConfirm ? "text" : "password"}
              dir="ltr"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="dir-ltr h-10 px-3 pe-10 text-sm"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
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

        {/* Submit Button */}
        <Field className="mt-2">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !!serverSuccess}
            className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="me-2 size-4 animate-spin" />
                <span>
                  {t("setupAccountSubmitting") || "Completing Setup..."}
                </span>
              </>
            ) : (
              <span>{t("setupAccountButton") || "Complete Setup & Login"}</span>
            )}
          </Button>
        </Field>

        <Field>
          <div className="text-center text-sm">
            <Link
              href="/login"
              className="font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("backToLogin") || "Back to Login"}
            </Link>
          </div>
        </Field>
      </FieldGroup>
    </form>
  )
}

export function SetupAccountForm(props: React.ComponentProps<"form">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SetupAccountFormContent {...props} />
    </Suspense>
  )
}
