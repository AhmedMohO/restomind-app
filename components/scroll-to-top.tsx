"use client"

import { usePathname } from "@/i18n/routing"
import { useLenis } from "lenis/react"
import { useEffect } from "react"

export function ScrollToTop() {
  const pathname = usePathname()
  const lenis = useLenis()

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, lenis])

  return null
}
