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

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const t = useTranslations("Auth")

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight font-heading text-foreground">
            {t("registerTitle")}
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("registerDescription")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">{t("fullNameLabel")}</FieldLabel>
          <Input 
            id="name" 
            type="text" 
            placeholder={t("fullNamePlaceholder")} 
            required 
            className="h-10 text-sm px-3 dark:bg-neutral-850"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder={t("emailPlaceholder")} 
            required 
            className="h-10 text-sm px-3 dark:bg-neutral-850"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
          <Input 
            id="password" 
            type="password" 
            required 
            className="h-10 text-sm px-3 dark:bg-neutral-850"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">{t("confirmPasswordLabel")}</FieldLabel>
          <Input 
            id="confirmPassword" 
            type="password" 
            required 
            className="h-10 text-sm px-3 dark:bg-neutral-850"
          />
        </Field>
        <Field className="mt-2">
          <Button type="submit" size="lg" className="w-full font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] h-10">
            {t("registerButton")}
          </Button>
        </Field>
        <FieldSeparator>{t("orContinueWith")}</FieldSeparator>
        <Field>
          <FieldDescription className="text-center text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">
              {t("signInLink")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
