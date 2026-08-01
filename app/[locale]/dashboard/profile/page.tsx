"use client"

import { DashboardProfileContainer } from "@/features/profile/components/dashboard-profile-container"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

/**
 * Profile page — any authenticated dashboard user can access.
 * DashboardProfileContainer fetches user data client-side via useProfile().
 */
function ProfilePageContent() {
  return (
    <main className="flex-1 p-6">
      <DashboardProfileContainer />
    </main>
  )
}

export default function DashboardProfilePage() {
  return (
    <DashboardAuthGuard>
      <ProfilePageContent />
    </DashboardAuthGuard>
  )
}
