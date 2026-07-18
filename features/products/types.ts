
export type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc"

export interface FilterState {
  searchQuery: string
  priceRange: [number, number]
  availability: {
    inStock: boolean
    outOfStock: boolean
  }
  categories: string[]
  tags: string[]
}
