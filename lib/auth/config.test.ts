import { describe, expect, test } from "bun:test"
import { getRouteRoles } from "./config"

describe("getRouteRoles", () => {
  test("resolves the more specific prefix even when a broader prefix is listed first in the map", () => {
    expect(getRouteRoles("/en/dashboard/offers/new")).toEqual(["admin", "manager", "staff"])
    expect(getRouteRoles("/en/dashboard/products/new")).toEqual(["admin", "manager"])
  })

  test("resolves newly-added admin-only settings and plans pages", () => {
    expect(getRouteRoles("/en/dashboard/admin/settings")).toEqual(["admin"])
    expect(getRouteRoles("/en/dashboard/admin/plans")).toEqual(["admin"])
  })

  test("still resolves the generic dashboard catch-all for unlisted pages", () => {
    expect(getRouteRoles("/en/dashboard/billing")).toEqual(["admin", "manager", "staff"])
  })

  test("still resolves unrelated broader prefixes correctly", () => {
    expect(getRouteRoles("/en/dashboard/offers/123")).toEqual(["admin", "manager", "staff"])
  })
})
