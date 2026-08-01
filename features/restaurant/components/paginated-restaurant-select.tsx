"use client"

import { Store } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectFetchResult,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type { PaginatedRestaurants, Restaurant } from "@/features/restaurant/types"

type RestaurantsResponse =
  | PaginatedRestaurants
  | Restaurant[]
  | {
      data?: PaginatedRestaurants | Restaurant[] | { data?: PaginatedRestaurants | Restaurant[] }
      items?: Restaurant[]
      totalPages?: number
      total?: number
    }

interface PaginatedRestaurantSelectProps {
  id?: string
  value?: string
  onValueChange: (value: string, restaurant?: Restaurant) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function PaginatedRestaurantSelect({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  className,
}: PaginatedRestaurantSelectProps) {
  const t = useTranslations("Dashboard.orders")

  const normalizeRestaurantsResponse = (
    res: RestaurantsResponse | undefined
  ): { restaurants: Restaurant[]; totalPages: number; total: number } => {
    if (!res) return { restaurants: [], totalPages: 1, total: 0 }
    if (Array.isArray(res)) {
      return { restaurants: res, totalPages: 1, total: res.length }
    }

    const directItems = "items" in res && Array.isArray(res.items) ? res.items : undefined
    if (directItems) {
      return {
        restaurants: directItems,
        totalPages: Number(res.totalPages ?? 1),
        total: Number(res.total ?? directItems.length),
      }
    }

    const nested = "data" in res ? res.data : undefined
    if (Array.isArray(nested)) {
      return { restaurants: nested, totalPages: 1, total: nested.length }
    }
    if (nested && typeof nested === "object") {
      const nestedData = "data" in nested ? nested.data : undefined
      if (Array.isArray(nestedData)) {
        return {
          restaurants: nestedData,
          totalPages: 1,
          total: nestedData.length,
        }
      }
      if ("items" in nested && Array.isArray(nested.items)) {
        return {
          restaurants: nested.items,
          totalPages: Number(nested.totalPages ?? 1),
          total: Number(nested.total ?? nested.items.length),
        }
      }
      if (
        nestedData &&
        typeof nestedData === "object" &&
        "items" in nestedData &&
        Array.isArray(nestedData.items)
      ) {
        return {
          restaurants: nestedData.items,
          totalPages: Number(nestedData.totalPages ?? 1),
          total: Number(nestedData.total ?? nestedData.items.length),
        }
      }
    }

    return { restaurants: [], totalPages: 1, total: 0 }
  }

  const fetchRestaurants = async (
    params: PaginatedSelectFetchParams
  ): Promise<PaginatedSelectFetchResult<Restaurant>> => {
    const qs = buildQueryString({
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    })
    const res = await clientFetch<RestaurantsResponse>(`/restaurants${qs}`)

    const { restaurants, totalPages, total } =
      normalizeRestaurantsResponse(res)

    const options: PaginatedSelectOption<Restaurant>[] = restaurants.map(
      (rest) => ({
        value: rest._id,
        label: rest.name,
        subLabel: [rest.address?.city, rest.address?.country]
          .filter(Boolean)
          .join(" • "),
        badge: rest.isActive ? undefined : "inactive",
        icon: <Store className="size-4" />,
        data: rest,
      })
    )

    return {
      items: options,
      totalPages,
      total,
    }
  }

  return (
    <PaginatedSelect<Restaurant>
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchRestaurants}
      queryKey={["restaurants-select"]}
      placeholder={placeholder ?? t("restaurantFilterPlaceholder")}
      searchPlaceholder={t("restaurantSearchPlaceholder")}
      disabled={disabled}
      className={className}
      limit={6}
    />
  )
}
