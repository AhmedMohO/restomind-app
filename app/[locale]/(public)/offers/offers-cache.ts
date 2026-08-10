import { cacheLife, cacheTag } from "next/cache"
import { getActiveOffers } from "@/features/offers/api"
import { getCategories } from "@/features/categories/api"
import { getRestaurants } from "@/features/restaurant/api"

export async function getCachedOffersData() {
  "use cache"
  cacheTag("offers-list", "offers", "categories", "restaurants")
  cacheLife("minutes")

  const [offersRes, categoriesRes, restaurantsRes] = await Promise.all([
    getActiveOffers({ page: 1, limit: 100 }).catch(() => undefined),
    getCategories().catch(() => undefined),
    getRestaurants({ page: 1, limit: 100 }).catch(() => undefined),
  ])

  return {
    initialOffers: offersRes?.items ?? [],
    allCategories: categoriesRes?.data ?? [],
    allRestaurants: restaurantsRes?.items ?? [],
  }
}
