"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { UserContainer } from "@/features/users/components/user-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function UsersPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <UserContainer />
        </main>
      </AppSidebar>
    </DashboardAuthGuard>
  )
}
