import { setRequestLocale } from "next-intl/server"
import type { Metadata } from "next"
import CheckoutFlow from "@/features/checkout/CheckoutFlow"
import { getAlternates } from "@/lib/seo/metadata"
import { getProfileApi, type UserAddress } from "@/features/profile/api/profile"

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

  // Prefill customer details and saved delivery addresses from the profile.
  // The route is under (protected), so the user is guaranteed authenticated.
  let addresses: UserAddress[] = []
  let fullName = ""
  let email = ""
  let phone = ""

  try {
    const profile = await getProfileApi()
    addresses = profile.addresses ?? []
    fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
    email = profile.email ?? ""
    phone = profile.phone ?? ""
  } catch {
    // Fall back to empty defaults; the user can still fill the form / add an address.
  }

  return (
    <CheckoutFlow
      initialAddresses={addresses}
      customer={{ fullName, email, phone }}
    />
  )
}
