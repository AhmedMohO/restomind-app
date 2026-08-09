import { z } from "zod"
import { StockTransactionTypeEnum, WasteReasonEnum, IngredientUnitEnum } from "@/features/inventory/types"

const ingredientUnitSchema = z.enum(IngredientUnitEnum)

export const createBatchSchema = z.object({
  ingredientId: z.string().min(1),
  batchNumber: z.string().min(1),
  quantityRemaining: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  expiryDate: z.string().min(1),
  receivedDate: z.string().optional(),
})

/** Bulk payload from the "Create Inventory Batches" page — matches backend CreateBatchesDto */
export const createBatchesSchema = z.object({
  batches: z.array(createBatchSchema).min(1),
})

export const createBatchOrBatchesSchema = z.union([
  createBatchSchema,
  createBatchesSchema,
])

export const createStockTransactionSchema = z.object({
  ingredientId: z.string().min(1),
  batchId: z.string().optional(),
  transactionType: z.enum(StockTransactionTypeEnum),
  quantity: z.number().positive(),
  unit: ingredientUnitSchema,
  date: z.string().optional(),
  wasteReason: z.enum(WasteReasonEnum).optional(),
  estimatedCost: z.number().nonnegative().optional(),
})

export const createWasteEventSchema = z.object({
  ingredientId: z.string().min(1),
  batchId: z.string().optional(),
  quantity: z.number().positive(),
  unit: ingredientUnitSchema,
  wasteReason: z.enum(WasteReasonEnum),
  estimatedCost: z.number().nonnegative(),
  date: z.string().optional(),
})
