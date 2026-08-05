import React, { Suspense } from "react"
import type { Metadata } from "next"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { routing } from "@/i18n/routing"
import { setRequestLocale } from "next-intl/server"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import SubscriptionGate from "@/features/subscription/components/SubscriptionGate"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Dashboard layout — protected by role via ProtectedRoute.
 *
 * ROUTE_ROLE_MAP assigns ["admin","manager"] to /dashboard, so
 * unauthenticated users are redirected to /login and unauthorized
 * users (customers) are redirected to the home page.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const safeLocale = routing.locales.includes(locale as "en" | "ar")
    ? locale
    : routing.defaultLocale

  setRequestLocale(safeLocale)

  return (
    <Suspense>
      <ProtectedRoute locale={safeLocale} route={`/${locale}/dashboard`}>
        <AppSidebar>
          {/* Resolved once here, so every dashboard page — present and
              future — is covered without per-page work. */}
          <SubscriptionGate locale={safeLocale}>{children}</SubscriptionGate>
        </AppSidebar>
      </ProtectedRoute>
    </Suspense>
  )
}
