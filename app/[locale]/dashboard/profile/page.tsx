"use client"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { DashboardProfileContainer } from "@/features/profile/components/dashboard-profile-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

/**
 * Profile page — any authenticated dashboard user can access.
 * DashboardProfileContainer fetches user data client-side via useProfile().
 */
function ProfilePageContent() {
  return (
    <AppSidebar>
      <main className="flex-1 p-6">
        <DashboardProfileContainer />
      </main>
    </AppSidebar>
  )
}

export default function DashboardProfilePage() {
  return (
    <DashboardAuthGuard>
      <ProfilePageContent />
    </DashboardAuthGuard>
  )
}
