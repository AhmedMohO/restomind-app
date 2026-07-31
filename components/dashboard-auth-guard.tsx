"use client"

/**
 * DashboardAuthGuard — Client-side auth gate for dashboard pages.
 *
 * Replaces per-page `requireRoleOrRedirect()` server calls. The server-side
 * ProtectedRoute in the dashboard layout is the security boundary; this
 * component handles fine-grained role checks and loading UX on the client.
 *
 * Usage:
 *   <DashboardAuthGuard roles={["admin", "manager"]}>
 *     <MyPageContent />
 *   </DashboardAuthGuard>
 */

import { useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import type { UserRole } from "@/features/auth/auth"
import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"

interface DashboardAuthGuardProps {
  children: React.ReactNode
  /**
   * Optional role whitelist. If omitted or empty, any authenticated user passes.
   * If provided, the current user's role must be in the list.
   */
  roles?: UserRole[]
  /**
   * Where to redirect unauthorized users. Defaults to "/dashboard".
   */
  redirectTo?: string
}

export function DashboardAuthGuard({
  children,
  roles,
  redirectTo = "/dashboard",
}: DashboardAuthGuardProps) {
  const { isHydrated, isAuthenticated, role } = useAuth()
  const router = useRouter()

  const hasRequiredRole =
    !roles || roles.length === 0 || (role !== null && roles.includes(role))

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || !hasRequiredRole)) {
      router.replace(redirectTo)
    }
  }, [isHydrated, isAuthenticated, hasRequiredRole, router, redirectTo])

  // Show loading spinner while hydrating or while we haven't confirmed access
  if (!isHydrated || !isAuthenticated || !hasRequiredRole) {
    return (
      <AppSidebar>
        <main className="flex-1 p-4 sm:p-6 min-w-0 w-full">
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </main>
      </AppSidebar>
    )
  }

  return <>{children}</>
}
