export interface ApiSupplier {
  _id: string
  restaurantId: string
  name: string
  email?: string
  phone?: string
  leadTimeDays?: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateSupplierPayload {
  name: string
  email?: string
  phone?: string
  leadTimeDays?: number
}

export interface GetSuppliersParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedSuppliers {
  items: ApiSupplier[]
  page: number
  limit: number
  total: number
  totalPages: number
}

