"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("loginDescription")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            required
            className="h-10 px-3 text-sm"
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
            <Link
              href="#"
              className="ms-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            className="h-10 px-3 text-sm"
          />
        </Field>
        <Field className="mt-2">
          <Button
            type="submit"
            size="lg"
            className="h-10 w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {t("loginButton")}
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
