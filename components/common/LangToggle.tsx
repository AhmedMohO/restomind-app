"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"
import { useTransition } from "react"
import { Button } from "../ui/button"

export default function LangToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function toggleLocale() {
    const nextLocale = locale === "en" ? "ar" : "en"
    const search = typeof window !== "undefined" ? window.location.search : ""
    const target = search ? `${pathname}${search}` : pathname
    startTransition(() => {
      router.replace(target, { locale: nextLocale })
    })
  }

  return (
    <Button
      onClick={toggleLocale}
      disabled={isPending}
      variant="outline"
      size="icon"
      aria-label="Switch language"
    >
      {locale === "en" ? "ar" : "en"}
    </Button>
  )
}
