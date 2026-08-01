"use client"

import { UserContainer } from "@/features/users/components/user-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

export default function UsersPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <UserContainer />
      </main>
    </DashboardAuthGuard>
  )
}
