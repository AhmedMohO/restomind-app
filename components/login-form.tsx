"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useZodResolver } from "@/lib/zod-locale"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { loginSchema, type LoginInput } from "@/schemas/login"
import { loginAction } from "@/features/auth/actions/login"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import type { UserRole } from "@/features/auth/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/routing"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: useZodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)

    const result = await loginAction(data)

    if (!result.success) {
      const errMsg = result.message ?? "Login failed"
      setServerError(errMsg)
      toast.error(errMsg)
      return
    }

    toast.success(t("loginSuccess") || "Logged in successfully")

    // Sync Zustand store immediately on success
    if (result.user) {
      setUser(result.user)
    }

    // Redirect based on role
    const role = result.user?.role
    const DASHBOARD_ROLES: UserRole[] = ["admin", "manager"]
    if (role && DASHBOARD_ROLES.includes(role)) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
    router.refresh()
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
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("loginDescription")}
          </p>
        </div>

        {/* Server-level error */}
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        {/* Email */}
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">{t("emailLabel")}</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!errors.email}
            className="h-10 px-3 text-sm"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        {/* Password */}
        <Field data-invalid={!!errors.password}>
          <div className="flex items-center">
            <FieldLabel htmlFor="login-password">
              {t("passwordLabel")}
            </FieldLabel>
            <Link
              href="/forgot-password"
              className="ms-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-10 px-3 pe-10 text-sm"
              {...register("password")}
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

        {/* Submit */}
        <Field className="mt-2">
          <Button
            id="login-submit"
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("loginButton")}…
              </>
            ) : (
              t("loginButton")
            )}
          </Button>
        </Field>

        <FieldSeparator>{t("orContinueWith")}</FieldSeparator>

        <Field>
          <FieldDescription className="text-center text-sm">
            {t("dontHaveAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("signUpLink")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
