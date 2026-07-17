import type { ApiImage } from "@/features/users/api/type"

export interface ApiCategory {
  _id: string
  name: string
  description: string
  image: ApiImage
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
