export type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc"

export interface FilterState {
  searchQuery: string
  priceRange: [number, number]
  categories: string[]
  tags: string[]
  isBestseller?: boolean
  featuredOnly?: boolean
  minDiscount?: number
}
