import { describe, expect, test } from "bun:test"
import {
  normalizeEgyptianPhone,
  isValidEgyptianPhone,
  egyptianPhoneSchema,
} from "./phone"

describe("Egyptian Phone Normalization and Validation", () => {
  test("normalizes local Egyptian mobile number starting with 0", () => {
    expect(normalizeEgyptianPhone("01012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("01012345678"))).toBe(true)

    expect(normalizeEgyptianPhone("01198765432")).toBe("+201198765432")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("01198765432"))).toBe(true)

    expect(normalizeEgyptianPhone("01234567890")).toBe("+201234567890")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("01234567890"))).toBe(true)

    expect(normalizeEgyptianPhone("01555555555")).toBe("+201555555555")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("01555555555"))).toBe(true)
  })

  test("handles missing leading 0 (10 digits starting with 1)", () => {
    expect(normalizeEgyptianPhone("1012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("1012345678"))).toBe(true)
  })

  test("handles user already adding +20 or +2 prefix", () => {
    expect(normalizeEgyptianPhone("+201012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("+201012345678"))).toBe(true)

    expect(normalizeEgyptianPhone("+2 01012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("+2 01012345678"))).toBe(true)

    expect(normalizeEgyptianPhone("+21012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("+21012345678"))).toBe(true)

    expect(normalizeEgyptianPhone("201012345678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("201012345678"))).toBe(true)
  })

  test("handles formatting spaces, hyphens, parentheses", () => {
    expect(normalizeEgyptianPhone("+20 101-234-5678")).toBe("+201012345678")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("+20 101-234-5678"))).toBe(true)
  })

  test("normalizes local Egyptian landlines", () => {
    expect(normalizeEgyptianPhone("0234567890")).toBe("+20234567890")
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("0234567890"))).toBe(true)
  })

  test("rejects invalid Egyptian numbers", () => {
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("12345"))).toBe(false)
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("+15551234567"))).toBe(false)
    expect(isValidEgyptianPhone(normalizeEgyptianPhone("01912345678"))).toBe(false) // 019 invalid mobile prefix
  })

  test("Zod schema transforms and validates correctly", () => {
    const res = egyptianPhoneSchema.safeParse("01012345678")
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toBe("+201012345678")
    }

    const invalidRes = egyptianPhoneSchema.safeParse("01912345678")
    expect(invalidRes.success).toBe(false)
  })
})
