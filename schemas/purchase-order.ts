import { z } from "zod"

export const purchaseOrderStatusEnum = z.enum(["draft", "sent", "received", "cancelled"])

export const createPurchaseOrderItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitCost: z.number().nonnegative(),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  items: z.array(createPurchaseOrderItemSchema).min(1, { message: "At least one item is required" }),
  status: purchaseOrderStatusEnum.optional(),
  expectedDeliveryDate: z.string().optional(),
})

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusEnum,
})
