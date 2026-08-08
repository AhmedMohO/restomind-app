import React, { Suspense } from "react"
import type { Metadata } from "next"
import { headers } from "next/headers"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { routing } from "@/i18n/routing"
import { setRequestLocale } from "next-intl/server"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { AssistantWidget } from "@/features/assistant/components/assistant-widget"
import SubscriptionGate from "@/features/subscription/components/SubscriptionGate"
import {
  getMySubscription,
  hasDashboardAccess,
} from "@/features/subscription/api"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Dashboard layout — protected by role via ProtectedRoute.
 *
 * The real visited path (set by proxy.ts as the `x-pathname` header) is
 * passed through so ProtectedRoute resolves the PER-PAGE role from
 * ROUTE_ROLE_MAP, not just the generic /dashboard role set. Falls back to
 * `/${locale}/dashboard` if the header is missing (e.g. direct server-side
 * invocation outside the normal request path).
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

  const requestHeaders = await headers()
  const currentPath = requestHeaders.get("x-pathname") ?? `/${locale}/dashboard`

  let needsSubscription = false
  try {
    const subscription = await getMySubscription()
    needsSubscription = !hasDashboardAccess(subscription.state)
  } catch {
    needsSubscription = false
  }

  return (
    <Suspense>
      <ProtectedRoute locale={safeLocale} route={currentPath}>
        <AppSidebar needsSubscription={needsSubscription}>
          {/* Resolved once here, so every dashboard page — present and
              future — is covered without per-page work. */}
          <SubscriptionGate locale={safeLocale}>{children}</SubscriptionGate>
        </AppSidebar>
        {/* Fixed-position, so it floats over every dashboard page. */}
        <AssistantWidget />
      </ProtectedRoute>
    </Suspense>
  )
}
