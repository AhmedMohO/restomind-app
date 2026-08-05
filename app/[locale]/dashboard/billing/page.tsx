import { Suspense } from "react"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import BillingWall from "@/features/subscription/components/BillingWall"
import { getMySubscription, getPaymentMethods } from "@/features/subscription/api"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * The billing screen. Reachable in every subscription state — including
 * expired — because it is the one page a locked-out merchant must be able to
 * open.
 */
export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale
  setRequestLocale(safeLocale)

  const [subscription, methods] = await Promise.all([
    getMySubscription(),
    getPaymentMethods().catch(() => ["card"] as ("card" | "wallet")[]),
  ])

  return (
    <Suspense>
      <BillingWall subscription={subscription} methods={methods} />
    </Suspense>
  )
}
