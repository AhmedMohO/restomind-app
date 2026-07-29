import { describe, expect, test } from "bun:test"
import {
  formatCurrency,
  formatNumber,
  formatPrice,
  hasPriceFractions,
  roundPrice,
} from "./utils"

describe("Price utility helpers", () => {
  describe("roundPrice", () => {
    test("rounds values to 2 decimal places accuracy", () => {
      expect(roundPrice(12.3456)).toBe(12.35)
      expect(roundPrice(12.3)).toBe(12.3)
      expect(roundPrice(12.0001)).toBe(12)
      expect(roundPrice(12)).toBe(12)
      expect(roundPrice(0)).toBe(0)
    })
  })

  describe("hasPriceFractions", () => {
    test("returns false for integers and true for fractional numbers", () => {
      expect(hasPriceFractions(12)).toBe(false)
      expect(hasPriceFractions(12.0)).toBe(false)
      expect(hasPriceFractions(12.0001)).toBe(false)
      expect(hasPriceFractions(12.5)).toBe(true)
      expect(hasPriceFractions(12.75)).toBe(true)
    })
  })

  describe("formatNumber", () => {
    test("omits fraction digits for integers", () => {
      expect(formatNumber(12, "en")).toBe("12")
      expect(formatNumber(100, "en")).toBe("100")
      expect(formatNumber(0, "en")).toBe("0")
    })

    test("shows up to 2 decimal places for fractional numbers", () => {
      expect(formatNumber(12.5, "en")).toBe("12.5")
      expect(formatNumber(12.75, "en")).toBe("12.75")
      expect(formatNumber(12.345, "en")).toBe("12.35")
    })
  })

  describe("formatCurrency", () => {
    test("formats integer currency without .00 fraction digits", () => {
      const formattedEn = formatCurrency(100, "en")
      expect(formattedEn).not.toContain(".00")
      expect(formattedEn).toContain("100")
    })

    test("formats fractional currency with accurate fraction digits", () => {
      const formattedEn = formatCurrency(100.5, "en")
      expect(formattedEn).toContain("100.5")

      const formattedEn2 = formatCurrency(100.75, "en")
      expect(formattedEn2).toContain("100.75")
    })
  })

  describe("formatPrice", () => {
    test("delegates to formatCurrency or formatNumber based on includeCurrency option", () => {
      expect(formatPrice(50, "en", false)).toBe("50")
      expect(formatPrice(50.5, "en", false)).toBe("50.5")
      expect(formatPrice(50, "en", true)).toContain("50")
    })
  })
})
