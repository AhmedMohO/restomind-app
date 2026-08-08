import { describe, expect, test } from "bun:test"
import { createSupplierSchema } from "./supplier"

describe("createSupplierSchema", () => {
  test("accepts a minimal valid supplier", () => {
    expect(createSupplierSchema.safeParse({ name: "Acme Foods" }).success).toBe(true)
  })

  test("rejects an empty name", () => {
    expect(createSupplierSchema.safeParse({ name: "" }).success).toBe(false)
  })

  test("rejects a negative leadTimeDays", () => {
    expect(createSupplierSchema.safeParse({ name: "Acme", leadTimeDays: -1 }).success).toBe(false)
  })
})
