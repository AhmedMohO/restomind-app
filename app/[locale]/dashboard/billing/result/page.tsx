import { Suspense } from "react"
import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import BillingResult from "@/features/subscription/components/BillingResult"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  title: "Subscription Payment Result",
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BillingResultPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale
  setRequestLocale(safeLocale)

  const query = await searchParams

  const getStringParam = (key: string): string | undefined => {
    const val = query[key]
    if (Array.isArray(val)) return val[0]
    return val
  }

  return (
    <Suspense>
      <BillingResult
        success={getStringParam("success")}
        pending={getStringParam("pending")}
        errorOccured={getStringParam("error_occured")}
        id={getStringParam("id")}
        order={getStringParam("order")}
        merchantOrderId={getStringParam("merchant_order_id")}
        amountCents={getStringParam("amount_cents") || getStringParam("amount_cents_int")}
        currency={getStringParam("currency")}
        message={getStringParam("data.message") || getStringParam("data_message")}
        pan={getStringParam("source_data.pan") || getStringParam("source_data_pan")}
        subType={getStringParam("source_data.sub_type") || getStringParam("source_data_sub_type")}
        txnResponseCode={getStringParam("txn_response_code")}
      />
    </Suspense>
  )
}
