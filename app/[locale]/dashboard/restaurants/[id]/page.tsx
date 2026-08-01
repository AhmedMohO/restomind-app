"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { Edit2, Loader2, MapPin, Phone, Store, User } from "lucide-react"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RestaurantStatusBadge } from "@/features/restaurant/components/restaurant-status-badge"
import { useQuery } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type { Restaurant } from "@/features/restaurant/types"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import { formatOwner } from "@/features/restaurant/utils/utils"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

function ViewRestaurantPageContent({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("Dashboard.restaurant")

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

  return (
    <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
      <div className="flex flex-col gap-6">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard/restaurants" />
            <div className="min-w-0">
              <h1 className="truncate font-heading text-2xl font-bold">
                {restaurant?.name ?? t("restaurantDetails")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("adminSubtitle")}
              </p>
            </div>
          </div>

          {restaurant && (
            <Button
              nativeButton={false}
              render={<Link href={`/dashboard/restaurants/${id}/edit`} />}
              className="w-full gap-2 rounded-xl sm:w-auto"
            >
              <Edit2 className="size-4" />
              <span>{t("editRestaurant")}</span>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError || !restaurant ? (
          <Card className="rounded-2xl p-8 text-center">
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
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
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {restaurant.image?.secure_url ? (
                <Image
                  src={restaurant.image.secure_url}
                  alt={restaurant.name}
                  className="size-16 shrink-0 rounded-xl border border-border object-cover"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                  <Store className="size-8" />
                </div>
              )}

              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-xl font-bold break-words">
                    {restaurant.name}
                  </h2>
                  <RestaurantStatusBadge isActive={restaurant.isActive} />
                </div>
                {restaurant.description && (
                  <p className="text-sm break-words text-muted-foreground">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 pt-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <Phone className="size-5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {t("phoneLabel")}
                    </span>
                    <span dir="ltr" className="text-sm font-medium">
                      {restaurant.phone || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <MapPin className="size-5 shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {t("sectionAddress")}
                    </span>
                    <span className="text-sm font-medium">
                      {restaurant.address?.city && restaurant.address?.country
                        ? `${restaurant.address?.city ?? ""}, ${restaurant.address?.country ?? ""}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                <User className="size-5 shrink-0 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t("selectOwner")}
                  </span>
                  <span className="text-sm font-medium">
                    {formatOwner(restaurant.ownerUserId)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

export default function ViewRestaurantPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  return (
    <DashboardAuthGuard roles={["admin"]}>
      <ViewRestaurantPageContent params={params} />
    </DashboardAuthGuard>
  )
}
