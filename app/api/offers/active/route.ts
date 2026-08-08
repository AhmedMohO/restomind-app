import { NextResponse, connection } from "next/server"
import type { ApiResponse } from "@/features/auth/auth"
import type { PaginatedOffers } from "@/features/offers/api/type"
import { getActiveOffers } from "@/features/offers/api"
import { handleUpstreamError } from "@/lib/api/route-helpers"

export async function GET(request: Request) {
  await connection()

  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? undefined
  const limit = searchParams.get("limit") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const categoryId = searchParams.get("categoryId") ?? undefined
  const restaurantId = searchParams.get("restaurantId") ?? undefined
  const featured = searchParams.get("featured") ?? undefined
  const minPrice = searchParams.get("minPrice") ?? undefined
  const maxPrice = searchParams.get("maxPrice") ?? undefined
  const sortBy = searchParams.get("sortBy") ?? undefined
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined

  try {
    const data = await getActiveOffers({
      ...(page ? { page: Number(page) } : {}),
      ...(limit ? { limit: Number(limit) } : {}),
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(restaurantId ? { restaurantId } : {}),
      ...(featured ? { featured: featured === "true" } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(sortBy ? { sortBy: sortBy as any } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    })
    return NextResponse.json<ApiResponse<PaginatedOffers>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (err) {
    console.error("[api/offers/active] GET failed", err)
    return handleUpstreamError(err, "Failed to fetch active offers")
  }
}
