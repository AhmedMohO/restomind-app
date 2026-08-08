// schemas/purchase-order.test.ts
import { describe, expect, test } from "bun:test"
import { createPurchaseOrderSchema, updatePurchaseOrderStatusSchema } from "./purchase-order"

describe("createPurchaseOrderSchema", () => {
  test("accepts a valid purchase order", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [{ ingredientId: "64f0000000000000000000bb", quantity: 5, unit: "kg", unitCost: 12.5 }],
    })
    expect(result.success).toBe(true)
  })

  test("rejects an empty items array", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [],
    })
    expect(result.success).toBe(false)
  })

  test("rejects a negative quantity", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "64f0000000000000000000aa",
      items: [{ ingredientId: "64f0000000000000000000bb", quantity: -1, unit: "kg", unitCost: 1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe("updatePurchaseOrderStatusSchema", () => {
  test("accepts a known status", () => {
    expect(updatePurchaseOrderStatusSchema.safeParse({ status: "sent" }).success).toBe(true)
  })

  test("rejects an unknown status", () => {
    expect(updatePurchaseOrderStatusSchema.safeParse({ status: "bogus" }).success).toBe(false)
  })
})
