import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import PaymentResult from "@/features/checkout/components/PaymentResult"

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false, follow: false },
}

/**
 * Where Paymob redirects the customer after Unified Checkout.
 *
 * Only the `group` parameter is read, and only to know WHICH order to ask our
 * own server about. Every other query parameter Paymob appends — including
 * anything that looks like a success flag — is ignored, because the redirect
 * is not authenticated.
 */
export default async function CheckoutResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ group?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { group } = await searchParams

  return <PaymentResult groupId={group ?? null} />
}
