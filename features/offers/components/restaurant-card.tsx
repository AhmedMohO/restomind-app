"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { RestaurantCardProps } from "@/features/offers/types"

export function RestaurantCard({
  restaurant,
  offersCount = 0,
  onSelect,
}: RestaurantCardProps) {
  const t = useTranslations("Offers")
  const [logoError, setLogoError] = useState(false)

  const coverUrl = restaurant.image?.secure_url
    ? restaurant.image?.secure_url
    : "/Landing/hero.webp"

  const logoUrl =
    !logoError && (restaurant as any).logo
      ? (restaurant as any).logo
      : undefined

  const addressText =
    restaurant.address?.city ||
    restaurant.address?.street ||
    restaurant.description ||
    "Local Bakery & Restaurant"

  return (
    <Card
      onClick={() => onSelect(restaurant._id)}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* Top Banner */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-[#7C4A27] via-[#9E5D32] to-[#C2733C]">
        <Image
          src={coverUrl}
          fill
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/20" />
        {/* Banner Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {offersCount > 0 && (
            <Badge className="rounded-full border-none bg-[#7C4A27]/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
              {t("offersCount", { count: offersCount })}
            </Badge>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col justify-between space-y-3 px-1 pt-3">
        <div className="flex items-start gap-3">
          {/* Logo Avatar */}
          <div className="relative -mt-6 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white text-base font-bold text-primary shadow-md dark:border-neutral-900 dark:bg-neutral-800">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={restaurant.name}
                fill
                onError={() => setLogoError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-[#7C4A27] dark:text-[#E68A49]">
                {restaurant.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate font-serif text-base font-bold text-[#2B1B15] transition-colors group-hover:text-primary dark:text-neutral-100">
              {restaurant.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {addressText}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
