import { cacheLife, cacheTag } from "next/cache"
import { getActiveOffer, type ApiOffer } from "@/features/offers/api"

export async function getCachedOffer(id: string): Promise<ApiOffer | null> {
  "use cache"
  cacheTag(`offer:${id}`, "offers")
  cacheLife("minutes")

  try {
    const res = await getActiveOffer(id)
    if (res?.data) return res.data
  } catch {
    // API unavailable during prerendering
  }
  return null
}