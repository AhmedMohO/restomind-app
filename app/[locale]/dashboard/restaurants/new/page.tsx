"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { BackButton } from "@/components/ui/back-button"
import { RestaurantForm } from "@/features/restaurant/components/restaurant-form"
import { useCreateRestaurant } from "@/features/restaurant/hooks/use-restaurant"
import type { RestaurantInput } from "@/schemas/restaurant"

import { useAuth } from "@/features/auth/hooks/useAuth"

export default function NewRestaurantPage() {
  const t = useTranslations("Dashboard.restaurant")
  const router = useRouter()
  const { role, isHydrated } = useAuth()

  React.useEffect(() => {
    if (isHydrated && role !== "admin") {
      router.replace("/dashboard/restaurants")
    }
  }, [isHydrated, role, router])

  const createMutation = useCreateRestaurant()

  if (!isHydrated || role !== "admin") {
    return null
  }

  const handleSubmit = async (
    values: RestaurantInput,
    ownerUserId?: string
  ) => {
    if (!ownerUserId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    try {
      await createMutation.mutateAsync({
        name: values.name,
        ownerUserId,
        description: values.description || undefined,
        phone: values.phone || undefined,
        // logoUrl: values.logoUrl || undefined,
        address: {
          street: values.address?.street || undefined,
          city: values.address?.city || undefined,
          country: values.address?.country || undefined,
        },
      })
      toast.success(t("createSuccess"))
      router.push("/dashboard/restaurants")
    } catch (err) {
      console.error("[NewRestaurantPage] submit failed", err)
      toast.error(t("createError"))
    }
  }

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BackButton href="/dashboard/restaurants" />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-2xl font-bold">
                  {t("createRestaurant")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("adminSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <RestaurantForm
            mode="create"
            onSubmit={handleSubmit}
            isPending={createMutation.isPending}
          />
        </div>
      </main>
    </AppSidebar>
  )
}
