"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardContainer } from "@/components/shadcn-space/blocks/dashboard-shell-01/dashboard-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { useAuth } from "@/features/auth/hooks/useAuth"

export default function Page() {
  const { role, isHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && role === "staff") {
      router.replace("/dashboard/orders")
    }
  }, [isHydrated, role, router])

  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <DashboardContainer />
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
