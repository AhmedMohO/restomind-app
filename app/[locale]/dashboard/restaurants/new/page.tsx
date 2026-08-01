"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { BackButton } from "@/components/ui/back-button"
import { RestaurantForm } from "@/features/restaurant/components/restaurant-form"
import { useCreateRestaurant } from "@/features/restaurant/hooks/use-restaurant"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { getErrorMessage } from "@/lib/api/utils"

function NewRestaurantPageContent() {
  const t = useTranslations("Dashboard.restaurant")
  const router = useRouter()
  const [formKey, setFormKey] = React.useState(0)

  const createMutation = useCreateRestaurant()

  const handleSubmit = async (formData: FormData, ownerUserId?: string) => {
    if (!ownerUserId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    try {
      await createMutation.mutateAsync(formData)
      toast.success(t("createSuccess"))
      setFormKey((k) => k + 1)
      router.push("/dashboard/restaurants")
    } catch (err) {
      console.error("[NewRestaurantPage] submit failed", err)
      toast.error(getErrorMessage(err, t("createError")))
    }
  }

  return (
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
          key={formKey}
          mode="create"
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      </div>
    </main>
  )
}

export default function NewRestaurantPage() {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <NewRestaurantPageContent />
    </DashboardAuthGuard>
  )
}
