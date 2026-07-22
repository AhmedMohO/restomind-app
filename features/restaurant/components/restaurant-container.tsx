"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { ClientFetchError } from "@/lib/api/fetch-client"
import { useMyRestaurant } from "../hooks/use-restaurant"

import { AdminRestaurantTable } from "./admin-restaurant-table"
import { NoRestaurantCard } from "./no-restaurant-card"
import { RestaurantProfileForm } from "./restaurant-profile-form"
import { RestaurantProfileSkeleton } from "./restaurant-profile-skeleton"

export function RestaurantContainer() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  // Admins manage all restaurants via the CRUD table.
  if (role === "admin") {
    return <AdminRestaurantTable />
  }

  return <ManagerRestaurantContainer />
}

function ManagerRestaurantContainer() {
  const t = useTranslations("Dashboard.restaurant")
  const { data, isLoading, isError, error, refetch, isFetching } =
    useMyRestaurant()

  if (isLoading) return <RestaurantProfileSkeleton />

  // 404 / null restaurant → friendly empty state.
  if (!data || (error instanceof ClientFetchError && error.status === 404)) {
    return <NoRestaurantCard />
  }

  if (isError) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center py-10">
        <Card className="w-full max-w-md border-border bg-card text-center shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-7" />
            </div>
            <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
            <Button
              variant="outline"
              className="mt-2 gap-2 rounded-xl"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RotateCw className="size-4" />
              <span>{t("retry")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <RestaurantProfileForm initialData={data} />
}
