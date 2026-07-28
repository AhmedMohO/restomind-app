"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RestaurantForm } from "@/features/restaurant/components/restaurant-form"
import { useAdminUpdateRestaurant } from "@/features/restaurant/hooks/use-restaurant"
import { useQuery } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type { Restaurant } from "@/features/restaurant/types"
import { Link } from "@/i18n/routing"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { getErrorMessage } from "@/lib/api/utils"

function EditRestaurantPageContent({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("Dashboard.restaurant")
  const router = useRouter()

  const {
    data: restaurant,
    isLoading,
    isError,
  } = useQuery<Restaurant | null>({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const res = await clientFetch<Restaurant>(`/restaurants/${id}`)
      return res ?? null
    },
  })

  const updateMutation = useAdminUpdateRestaurant()

  const handleSubmit = async (formData: FormData) => {
    try {
      await updateMutation.mutateAsync({ id, payload: formData })
      toast.success(t("saveSuccess"))
      router.push("/dashboard/restaurants")
    } catch (err) {
      console.error("[EditRestaurantPage] submit failed", err)
      toast.error(getErrorMessage(err, t("saveError")))
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
                  {t("editRestaurant")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("adminSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 w-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : isError || !restaurant ? (
            <Card className="rounded-2xl p-8 text-center">
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("fetchError")}
                </p>
                <Button
                  variant="outline"
                  render={<Link href="/dashboard/restaurants" />}
                  className="mt-4 rounded-xl"
                >
                  {t("backToList")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <RestaurantForm
              mode="edit"
              restaurant={restaurant}
              onSubmit={handleSubmit}
              isPending={updateMutation.isPending}
            />
          )}
        </div>
      </main>
    </AppSidebar>
  )
}

export default function EditRestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <EditRestaurantPageContent params={params} />
    </DashboardAuthGuard>
  )
}
