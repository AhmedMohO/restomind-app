import type { ApiImage } from "@/features/users/api/type"

export interface ApiCategory {
  _id: string
  name: string
  description: string
  image?: ApiImage
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedCategories {
  data: ApiCategory[]
  page: number
  limit: number
  totalPages: number
  totalCount?: number
  total?: number
}

export interface GetCategoriesParams {
  page?: number
  limit?: number
  search?: string
}
