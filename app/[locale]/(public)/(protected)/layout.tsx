import React, { Suspense } from "react"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { setRequestLocale } from "next-intl/server"
import { CartProvider } from "@/hooks/use-cart"

/**
 * Protected route group layout.
 *
 * All routes under this group require authentication (any role).
 * The guard is intentionally auth-only here — individual sub-routes
 * can override with a stricter role check in their own layout if
 * needed. ROUTE_ROLE_MAP assigns no specific roles for /orders,
 * /favourites, /checkout (empty array = auth-only).
 */
export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense>
      <CartProvider>
        <ProtectedRoute locale={locale}>{children}</ProtectedRoute>
      </CartProvider>
    </Suspense>
  )
}
