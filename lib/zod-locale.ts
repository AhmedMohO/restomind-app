import { z } from "zod"
import { ar, en } from "zod/locales"
import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale } from "next-intl"
import arMessages from "@/messages/ar.json"
import enMessages from "@/messages/en.json"

export type ZodLocaleIssue = Parameters<ReturnType<typeof ar>["localeError"]>[0]

export function getZodErrorMap(locale: string) {
  const isAr = locale === "ar"
  const baseErrorMap = isAr ? ar().localeError : en().localeError
  const dict = (isAr ? arMessages : enMessages).Validation as Record<string, string> | undefined

  return (issue: ZodLocaleIssue) => {
    // 1. Check if a custom translation key was passed via issue.message or issue.params?.key
    if (issue.message && dict?.[issue.message]) {
      return dict[issue.message]
    }

    const customKey = (issue as { params?: { key?: string } }).params?.key
    if (customKey && dict?.[customKey]) {
      return dict[customKey]
    }

    // 2. Generic required field
    if (issue.code === "invalid_type" && issue.input === undefined) {
      return dict?.required ?? (isAr ? "هذا الحقل مطلوب" : "This field is required")
    }

    // 3. Generic string min/max/exact length
    if (issue.code === "too_small" && issue.origin === "string") {
      if (issue.exact) {
        const tmpl = dict?.exactLength ?? (isAr ? "يجب أن يكون مكوناً من {length} أرقام/أحرف بالظبط" : "Must be exactly {length} characters")
        return tmpl.replace("{length}", String(issue.minimum))
      }
      const tmpl = dict?.minChars ?? (isAr ? "يجب أن يحتوي على {min} أحرف على الأقل" : "Must be at least {min} characters")
      return tmpl.replace("{min}", String(issue.minimum))
    }

    if (issue.code === "too_big" && issue.origin === "string") {
      const tmpl = dict?.maxChars ?? (isAr ? "يجب ألا يتجاوز {max} حرفاً" : "Must be at most {max} characters")
      return tmpl.replace("{max}", String(issue.maximum))
    }

    // 4. Generic email format
    if (issue.code === "invalid_format" && issue.format === "email") {
      return dict?.invalidEmail ?? (isAr ? "البريد الإلكتروني غير صحيح" : "Must be a valid email address")
    }

    // Fallback to Zod native locale error map
    return baseErrorMap(issue)
  }
}

/**
 * Global fallback setter (useful for client side single-session initialization)
 */
export function setZodLocale(locale: string) {
  z.setErrorMap(getZodErrorMap(locale))
}

/**
 * React Hook for forms — returns a request-isolated, locale-aware Zod resolver.
 * Preferred pattern for client forms to prevent global state mutation.
 */
export function useZodResolver<T extends z.ZodTypeAny>(schema: T) {
  const locale = useLocale()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any, {
    error: getZodErrorMap(locale),
  })
}
