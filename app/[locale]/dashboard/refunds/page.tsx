import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import RefundsTable from "@/features/refunds/components/RefundsTable"
import { getRefunds } from "@/features/refunds/api"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  title: "Refunds",
  robots: { index: false, follow: false },
}

export default async function RefundsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale
  setRequestLocale(safeLocale)

  // Called directly rather than through the server action: actions are for
  // client-triggered mutations, and invoking one during render breaks
  // prerendering when it reaches for cookies().
  const refunds = await getRefunds()
    .then((res) => res.data ?? [])
    .catch(() => [])

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Requests awaiting your decision appear first. Refunds marked{" "}
          <span className="font-medium">Needs manual payout</span> were refused
          by the payment gateway and must be settled with the customer
          directly.
        </p>
      </header>

      <RefundsTable refunds={refunds} />
    </div>
  )
}
