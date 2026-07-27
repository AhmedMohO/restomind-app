"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardContainer } from "@/components/shadcn-space/blocks/dashboard-shell-01/dashboard-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function Page() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <DashboardContainer />
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
