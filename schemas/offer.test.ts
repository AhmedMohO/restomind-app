import { describe, expect, test } from "bun:test"
import { createOfferSchema, updateOfferSchema } from "./offer"

describe("createOfferSchema", () => {
  test("accepts a valid offer", () => {
    expect(
      createOfferSchema.safeParse({
        productId: "64f0000000000000000000aa",
        startDate: "2026-08-08T00:00:00.000Z",
        endDate: "2026-08-15T00:00:00.000Z",
        availableQuantity: 10,
      }).success
    ).toBe(true)
  })

  test("rejects a negative availableQuantity", () => {
    expect(
      createOfferSchema.safeParse({
        productId: "x",
        startDate: "2026-08-08T00:00:00.000Z",
        endDate: "2026-08-15T00:00:00.000Z",
        availableQuantity: -1,
      }).success
    ).toBe(false)
  })
})

describe("updateOfferSchema", () => {
  test("accepts a partial update", () => {
    expect(updateOfferSchema.safeParse({ featured: true }).success).toBe(true)
  })

  test("rejects an unknown status", () => {
    expect(updateOfferSchema.safeParse({ status: "bogus" }).success).toBe(false)
  })
})
