// schemas/inventory.test.ts
import { describe, expect, test } from "bun:test"
import {
  createBatchesSchema,
  createBatchSchema,
  createStockTransactionSchema,
  createWasteEventSchema,
} from "./inventory"

describe("createBatchSchema", () => {
  test("accepts a valid batch", () => {
    expect(
      createBatchSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        batchNumber: "B-001",
        quantityRemaining: 10,
        unitCost: 2.5,
        expiryDate: "2026-12-31",
      }).success
    ).toBe(true)
  })

  test("rejects a negative quantityRemaining", () => {
    expect(
      createBatchSchema.safeParse({
        ingredientId: "x",
        batchNumber: "B-001",
        quantityRemaining: -1,
        unitCost: 2.5,
        expiryDate: "2026-12-31",
      }).success
    ).toBe(false)
  })
})

describe("createBatchesSchema", () => {
  test("accepts a bulk batches payload", () => {
    expect(
      createBatchesSchema.safeParse({
        batches: [
          {
            ingredientId: "64f0000000000000000000aa",
            batchNumber: "B-001",
            quantityRemaining: 10,
            unitCost: 2.5,
            expiryDate: "2026-12-31",
          },
        ],
      }).success
    ).toBe(true)
  })

  test("rejects an empty batches array", () => {
    expect(createBatchesSchema.safeParse({ batches: [] }).success).toBe(false)
  })
})

describe("createStockTransactionSchema", () => {
  test("accepts a valid transaction", () => {
    expect(
      createStockTransactionSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        transactionType: "purchase",
        quantity: 5,
        unit: "kg",
      }).success
    ).toBe(true)
  })

  test("rejects an unknown transactionType", () => {
    expect(
      createStockTransactionSchema.safeParse({
        ingredientId: "x",
        transactionType: "bogus",
        quantity: 5,
        unit: "kg",
      }).success
    ).toBe(false)
  })
})

describe("createWasteEventSchema", () => {
  test("accepts a valid waste event", () => {
    expect(
      createWasteEventSchema.safeParse({
        ingredientId: "64f0000000000000000000aa",
        quantity: 2,
        unit: "kg",
        wasteReason: "spoiled",
        estimatedCost: 10,
      }).success
    ).toBe(true)
  })

  test("rejects an unknown wasteReason", () => {
    expect(
      createWasteEventSchema.safeParse({
        ingredientId: "x",
        quantity: 2,
        unit: "kg",
        wasteReason: "bogus",
        estimatedCost: 10,
      }).success
    ).toBe(false)
  })
})
