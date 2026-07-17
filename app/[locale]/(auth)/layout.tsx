import React, { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/auth"
import { routing } from "@/i18n/routing"
import { setRequestLocale } from "next-intl/server"

async function AuthGuard({
  children,
  safeLocale,
}: {
  children: React.ReactNode
  safeLocale: string
}) {
  const user = await getCurrentUser()
  if (user) {
    redirect(`/${safeLocale}`)
  }
  return <>{children}</>
}

/**
 * Auth group layout — redirects authenticated users to home.
 * This is defense-in-depth. The proxy already catches most cases,
 * but this layout catches any edge case where the proxy is skipped
 * (e.g. a direct render bypass).
 */
export default async function AuthLayout({
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
      <AuthGuard safeLocale={safeLocale}>{children}</AuthGuard>
    </Suspense>
  )
}