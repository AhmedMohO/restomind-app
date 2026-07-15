export interface Product {
  id: string
  title: string
  description: string
  longDescription: string
  price: number // in EGP
  rating: number
  reviewsCount: number
  isBestseller: boolean
  isAvailable: boolean
  image: string
  category: string
  prepTime: string // e.g. "18 hrs"
  calories: number // e.g. 340
  freshnessWindow: number // hours, e.g. 12
  tags: string[]
}

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
