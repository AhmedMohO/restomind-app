"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { setZodLocale } from "@/lib/zod-locale"

export function ZodLocaleProvider({ children }: { children?: React.ReactNode }) {
  const locale = useLocale()

  // Ensure Zod locale is set during render and when locale changes
  setZodLocale(locale)

  useEffect(() => {
    setZodLocale(locale)
  }, [locale])

  return <>{children}</>
}
