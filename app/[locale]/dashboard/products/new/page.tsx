import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { ProductFormPage } from "@/features/products/components/product-form-page"
import { requireRoleOrRedirect } from "@/lib/auth/auth"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Dashboard.products" })
  return {
    title: t("createProduct"),
    description: t("formPageSubtitleCreate"),
    robots: { index: false, follow: false },
  }
}

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  await requireRoleOrRedirect(["admin", "manager"], locale)

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <ProductFormPage mode="create" />
      </main>
    </AppSidebar>
  )
}

