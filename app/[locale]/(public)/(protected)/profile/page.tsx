import { setRequestLocale } from "next-intl/server"
import { requireAuth } from "@/lib/auth/auth"
import { getProfileApi, getAddressesApi } from "@/features/profile/api/profile"
import { ProfileContainer } from "@/features/profile/components/profile-container"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return {
    title: locale === "ar" ? "حسابي الشخصي — RestoMind" : "My Account — RestoMind",
    description: "Manage your personal details and delivery addresses",
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Enforce auth via server-side helper
  await requireAuth()

  // Fetch initial profile and saved addresses
  const [user, addresses] = await Promise.all([
    getProfileApi().catch((err) => {
      console.error("[ProfilePage] Failed to fetch profile:", err)
      throw err
    }),
    getAddressesApi().catch((err) => {
      console.warn("[ProfilePage] Failed to fetch addresses:", err)
      return []
    }),
  ])

  // Fallback to user.addresses if getAddressesApi returned empty but user.addresses has values
  const finalAddresses =
    addresses.length > 0
      ? addresses
      : user.addresses && user.addresses.length > 0
      ? user.addresses
      : []

  return (
    <main className="min-h-[80vh] py-8 sm:py-10">
      <ProfileContainer
        initialUser={user}
        initialAddresses={finalAddresses}
      />
    </main>
  )
}
