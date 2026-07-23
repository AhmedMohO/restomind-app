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
import type { RestaurantInput } from "@/schemas/restaurant"
import { useQuery } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type {
  Restaurant,
  UpdateRestaurantPayload,
} from "@/features/restaurant/types"
import { Link } from "@/i18n/routing"

export default function EditRestaurantPage({
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

  const handleSubmit = async (values: RestaurantInput) => {
    try {
      const payload: UpdateRestaurantPayload = {
        name: values.name,
        description: values.description || null,
        phone: values.phone || null,
        // logoUrl: values.logoUrl || null,
        address: {
          street: values.address?.street || undefined,
          city: values.address?.city || undefined,
          country: values.address?.country || undefined,
        },
        isActive: values.isActive,
      }

      await updateMutation.mutateAsync({ id, payload })
      toast.success(t("saveSuccess"))
      router.push("/dashboard/restaurants")
    } catch (err) {
      console.error("[EditRestaurantPage] submit failed", err)
      toast.error(t("saveError"))
    }
  }

  const defaultValues: Partial<RestaurantInput> | undefined = restaurant
    ? {
        name: restaurant.name ?? "",
        description: restaurant.description ?? "",
        phone: restaurant.phone ?? "",
        logoUrl: restaurant.logoUrl ?? "",
        address: {
          street: restaurant.address?.street ?? "",
          city: restaurant.address?.city ?? "",
          country: restaurant.address?.country ?? "",
        },
        isActive: restaurant.isActive ?? true,
      }
    : undefined

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
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isPending={updateMutation.isPending}
            />
          )}
        </div>
      </main>
    </AppSidebar>
  )
}
