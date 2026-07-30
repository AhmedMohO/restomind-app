export enum StockTransactionTypeEnum {
  PURCHASE = "purchase",
  CONSUMPTION = "consumption",
  WASTE = "waste",
  ADJUSTMENT = "adjustment",
  TRANSFER_IN = "transfer_in",
  TRANSFER_OUT = "transfer_out",
  RETURN_TO_SUPPLIER = "return_to_supplier",
}

export enum WasteReasonEnum {
  EXPIRED = "expired",
  OVERPRODUCTION = "overproduction",
  PREPARATION_LOSS = "preparation_loss",
  SPOILED = "spoiled",
  CUSTOMER_RETURN = "customer_return",
  DAMAGED = "damaged",
  INCORRECT_ORDER = "incorrect_order",
  UNKNOWN = "unknown",
}

export enum IngredientUnitEnum {
  KG = "kg",
  G = "g",
  L = "l",
  ML = "ml",
  PIECE = "piece",
  PACK = "pack",
  BOX = "box",
  OZ = "oz",
  LB = "lb",
}

export interface InventoryIngredientPopulated {
  _id: string
  name: string
  unit: string
  currentStock?: number
}

export interface InventoryBatchPopulated {
  _id: string
  batchNumber: string
}

export interface InventoryBatch {
  _id: string
  restaurantId: string
  ingredientId: string | InventoryIngredientPopulated
  batchNumber: string
  quantityRemaining: number
  unitCost: number
  expiryDate: string
  receivedDate: string
  createdAt?: string
  updatedAt?: string
}

export interface StockTransaction {
  _id: string
  restaurantId: string
  ingredientId: string | InventoryIngredientPopulated
  batchId?: string | InventoryBatchPopulated | null
  transactionType: StockTransactionTypeEnum
  quantity: number
  unit: IngredientUnitEnum
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface WasteEvent {
  _id: string
  restaurantId: string
  ingredientId: string | InventoryIngredientPopulated
  batchId?: string | InventoryBatchPopulated | null
  quantity: number
  unit: IngredientUnitEnum
  wasteReason: WasteReasonEnum
  estimatedCost: number
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedBatches = PaginatedResponse<InventoryBatch>
export type PaginatedStockTransactions = PaginatedResponse<StockTransaction>
export type PaginatedWasteEvents = PaginatedResponse<WasteEvent>

export interface CreateBatchInput {
  ingredientId: string
  batchNumber: string
  quantityRemaining: number
  unitCost: number
  expiryDate: string
  receivedDate?: string
}

/** Multi-batch payload — matches backend CreateBatchesDto */
export interface CreateBatchesInput {
  batches: CreateBatchInput[]
}

export interface CreateStockTransactionInput {
  ingredientId: string
  batchId?: string
  transactionType: StockTransactionTypeEnum
  quantity: number
  unit: IngredientUnitEnum
  date?: string
  wasteReason?: WasteReasonEnum
  estimatedCost?: number
}

export interface CreateWasteEventInput {
  ingredientId: string
  batchId?: string
  quantity: number
  unit: IngredientUnitEnum
  wasteReason: WasteReasonEnum
  estimatedCost: number
  date?: string
}

export interface GetBatchesParams {
  page?: number
  limit?: number
  ingredientId?: string
}

export interface GetStockTransactionsParams {
  page?: number
  limit?: number
  ingredientId?: string
  transactionType?: StockTransactionTypeEnum
}

export interface GetWasteEventsParams {
  page?: number
  limit?: number
  ingredientId?: string
  wasteReason?: WasteReasonEnum
}
