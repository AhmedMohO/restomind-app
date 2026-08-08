import { describe, expect, test } from "bun:test"
import { createPartnershipSchema } from "./partnership"

describe("createPartnershipSchema", () => {
  test("accepts a minimal valid application", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessName: "Joe's Diner",
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "joe@example.com",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(true)
  })

  test("rejects a missing businessName", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "joe@example.com",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(false)
  })

  test("rejects an invalid email", () => {
    expect(
      createPartnershipSchema.safeParse({
        businessName: "Joe's Diner",
        businessType: "restaurant",
        ownerFirstName: "Joe",
        ownerLastName: "Smith",
        email: "not-an-email",
        phone: "+201012345678",
        city: "Cairo",
      }).success
    ).toBe(false)
  })
})
