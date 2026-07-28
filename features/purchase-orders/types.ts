export type PurchaseOrderStatus = "draft" | "sent" | "received" | "cancelled"

export interface ApiPurchaseOrderIngredientDetails {
  _id: string
  name: string
  unit: string
  ingredientCode?: string
}

export interface ApiPurchaseOrderItem {
  ingredientId: ApiPurchaseOrderIngredientDetails | string
  quantity: number
  unit: string
  unitCost: number
}

export interface ApiPurchaseOrderSupplier {
  _id: string
  name: string
  phone?: string
  email?: string
}

export interface ApiPurchaseOrderUser {
  _id: string
  name?: string
  email?: string
}

export interface ApiPurchaseOrder {
  _id: string
  restaurantId: string
  supplierId: ApiPurchaseOrderSupplier | string
  items: ApiPurchaseOrderItem[]
  status: PurchaseOrderStatus
  expectedDeliveryDate?: string | null
  createdBy?: ApiPurchaseOrderUser | string
  createdAt: string
  updatedAt: string
}

export interface GetPurchaseOrdersParams {
  page?: number
  limit?: number
  status?: PurchaseOrderStatus
  supplierId?: string
}

export interface PaginatedPurchaseOrders {
  items: ApiPurchaseOrder[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreatePurchaseOrderItemInput {
  ingredientId: string
  quantity: number
  unit: string
  unitCost: number
}

export interface CreatePurchaseOrderInput {
  supplierId: string
  items: CreatePurchaseOrderItemInput[]
  status?: PurchaseOrderStatus
  expectedDeliveryDate?: string
}

export interface PurchaseOrderFormRowItem {
  id: string
  ingredientId: string
  quantity: number
  unit: string
  unitCost: number
}

export interface SupplierDetails {
  name: string
  phone?: string
  email?: string
}

export interface UserDetails {
  name: string
  email?: string
}

export interface IngredientDetails {
  name: string
  code?: string
  unit?: string
}

