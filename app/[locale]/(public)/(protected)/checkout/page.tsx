import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import CheckoutFlow from "@/features/checkout/CheckoutFlow"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Checkout",
    description: "Complete your order and rescue delicious surplus food.",
    alternates: getAlternates(locale, "/checkout"),
    robots: { index: false, follow: false },
  }
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CheckoutFlow />
}
