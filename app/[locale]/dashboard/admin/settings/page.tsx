"use client"

import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { SystemSettingsPanel } from "@/features/system-settings/components/system-settings-panel"

export default function AdminSettingsPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <SystemSettingsPanel />
      </main>
    </DashboardAuthGuard>
  )
}
