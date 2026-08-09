"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { NotificationsManager } from "@/features/notifications/components/notifications-manager"

export default function NotificationsPage() {
  return (
    <DashboardAuthGuard roles={["admin", "manager", "staff"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <NotificationsManager />
      </main>
    </DashboardAuthGuard>
  )
}
