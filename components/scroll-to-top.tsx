"use client"

import { usePathname } from "@/i18n/routing"
import { useLenis } from "lenis/react"
import { useEffect } from "react"

export function ScrollToTop() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, lerp: 0.05 })
  }, [pathname, lenis])

  return null
}
