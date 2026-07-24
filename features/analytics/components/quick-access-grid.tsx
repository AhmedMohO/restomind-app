"use client"

import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/routing"
import {
  Store,
  LayoutGrid,
  Users,
  Tag,
  ShoppingBag,
  Settings,
} from "lucide-react"
import { useTranslations } from "next-intl"

export function QuickAccessGrid() {
  const t = useTranslations("Dashboard.analytics")

  const actions = [
    {
      id: "restaurants",
      title: t("quickAccessRestaurants"),
      subtitle: t("quickAccessRestaurantsSub"),
      icon: Store,
      href: "/dashboard/restaurants",
    },
    {
      id: "categories",
      title: t("quickAccessCategories"),
      subtitle: t("quickAccessCategoriesSub"),
      icon: LayoutGrid,
      href: "/dashboard/categories",
    },
    {
      id: "users",
      title: t("quickAccessUsers"),
      subtitle: t("quickAccessUsersSub"),
      icon: Users,
      href: "/dashboard/users",
    },
    {
      id: "offers",
      title: t("quickAccessOffers"),
      subtitle: t("quickAccessOffersSub"),
      icon: Tag,
      href: "/dashboard/offers",
    },
    {
      id: "orders",
      title: t("quickAccessOrders"),
      subtitle: t("quickAccessOrdersSub"),
      icon: ShoppingBag,
      href: "/dashboard/orders",
    },
    {
      id: "settings",
      title: t("quickAccessSettings"),
      subtitle: t("quickAccessSettingsSub"),
      icon: Settings,
      href: "/dashboard/profile",
    },
  ]

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col space-y-0.5">
        <h3 className="text-base font-bold text-foreground">
          {t("quickAccessTitle")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("quickAccessSub")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.id} href={action.href} className="group">
              <Card className="flex h-full flex-col items-center justify-center space-y-2.5 rounded-2xl border border-border/80 bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary">
                    {action.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {action.subtitle}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
