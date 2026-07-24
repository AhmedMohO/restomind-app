import { describe, expect, test } from "bun:test"
import { parseAndFormatPhone } from "./phone-input"

describe("PhoneInput Parsing and Formatting Engine", () => {
  test("National Egyptian Mobile: '01020697551' -> detects EG, displays national '010 20697551', emits '+201020697551'", () => {
    const res = parseAndFormatPhone("01020697551", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("010 20697551")
    expect(res.e164Value).toBe("+201020697551")
  })

  test("National Egyptian Mobile: '01012345678' -> detects EG, displays national '010 12345678', emits '+201012345678'", () => {
    const res = parseAndFormatPhone("01012345678", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("010 12345678")
    expect(res.e164Value).toBe("+201012345678")
  })

  test("International Egyptian Mobile with +: '+201020697551' -> strips +20, detects EG, displays national '010 20697551', emits '+201020697551'", () => {
    const res = parseAndFormatPhone("+201020697551", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("010 20697551")
    expect(res.e164Value).toBe("+201020697551")
  })

  test("Egyptian Landline 02: '0234567890' -> detects EG, displays national '02 34567890', emits '+20234567890'", () => {
    const res = parseAndFormatPhone("0234567890", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("02 34567890")
    expect(res.e164Value).toBe("+20234567890")
  })

  test("International Egyptian Landline 02 with +: '+20234567890' -> strips +20, detects EG, displays national '02 34567890', emits '+20234567890'", () => {
    const res = parseAndFormatPhone("+20234567890", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("02 34567890")
    expect(res.e164Value).toBe("+20234567890")
  })

  test("International Saudi with +: '+966501234567' -> detects SA, strips +966, displays national '050 123 4567', emits '+966501234567'", () => {
    const res = parseAndFormatPhone("+966501234567", "EG")
    expect(res.country.code).toBe("SA")
    expect(res.displayNational).toBe("050 123 4567")
    expect(res.e164Value).toBe("+966501234567")
  })

  test("International UAE with +: '+971501234567' -> detects AE, strips +971, displays national '050 123 4567', emits '+971501234567'", () => {
    const res = parseAndFormatPhone("+971501234567", "EG")
    expect(res.country.code).toBe("AE")
    expect(res.displayNational).toBe("050 123 4567")
    expect(res.e164Value).toBe("+971501234567")
  })

  test("International US with +: '+15551234567' -> detects US, strips +1, displays national '(555) 123-4567', emits '+15551234567'", () => {
    const res = parseAndFormatPhone("+15551234567", "EG")
    expect(res.country.code).toBe("US")
    expect(res.displayNational).toBe("(555) 123-4567")
    expect(res.e164Value).toBe("+15551234567")
  })

  test("Pasted full number with 20 prefix without plus: '201020697551' -> detects EG, displays '010 20697551', emits '+201020697551'", () => {
    const res = parseAndFormatPhone("201020697551", "EG")
    expect(res.country.code).toBe("EG")
    expect(res.displayNational).toBe("010 20697551")
    expect(res.e164Value).toBe("+201020697551")
  })
})
