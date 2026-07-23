import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { getProfileApi } from "@/features/profile/api/profile"
import { DashboardProfileContainer } from "@/features/profile/components/dashboard-profile-container"
import { requireAuthOrRedirect } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Account Profile",
  description: "Manage your executive profile and account settings",
  robots: { index: false, follow: false },
}

export default async function DashboardProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireAuthOrRedirect(locale)

  const user = await getProfileApi().catch(() => null)

  const safeUser = user ?? {
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "manager" as const,
    phone: "",
    isEmailVerified: false,
    isDeleted: false,
    createdAt: "",
    updatedAt: "",
  }

  return (
    <AppSidebar>
      <main className="flex-1 p-6">
        <DashboardProfileContainer initialUser={safeUser} />
      </main>
    </AppSidebar>
  )
}
