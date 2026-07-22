"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Store, UserRound } from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProfileContainer } from "@/features/profile/components/profile-container"
import { RestaurantContainer } from "@/features/restaurant/components/restaurant-container"
import type { FullUser, UserAddress } from "@/features/profile/api/profile"

interface DashboardProfileTabsProps {
  initialUser: FullUser
  initialAddresses: UserAddress[]
}

type TabValue = "restaurant" | "account"

export function DashboardProfileTabs({
  initialUser,
  initialAddresses,
}: DashboardProfileTabsProps) {
  const t = useTranslations("Dashboard.account")
  const searchParams = useSearchParams()

  // Honor ?tab=account when linking from the sidebar/dropdown.
  const queryTab = searchParams.get("tab")
  const initial =
    queryTab === "account" || queryTab === "restaurant" ? (queryTab as TabValue) : "restaurant"
  const [value, setValue] = React.useState<TabValue>(initial)

  return (
    <Tabs
      value={value}
      onValueChange={(v) => setValue((v as TabValue) ?? "restaurant")}
      className="flex flex-col gap-6"
    >
      <TabsList className="mx-auto mt-6 h-10 w-fit rounded-xl border border-border bg-card px-1.5">
        <TabsTrigger
          value="restaurant"
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold"
        >
          <Store className="size-4" />
          <span>{t("tabRestaurant")}</span>
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold"
        >
          <UserRound className="size-4" />
          <span>{t("tabAccount")}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="restaurant">
        <RestaurantContainer />
      </TabsContent>

      <TabsContent value="account">
        <ProfileContainer
          initialUser={initialUser}
          initialAddresses={initialAddresses}
        />
      </TabsContent>
    </Tabs>
  )
}
