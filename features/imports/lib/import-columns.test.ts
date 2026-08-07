import { describe, expect, test } from "bun:test"
import type { ImportResult as CsvImportResult } from "@importcsv/react"

import { IMPORT_TYPES } from "@/features/imports/api/type"
import { IMPORT_COLUMNS, rowsToCsvFile } from "./import-columns"

const asResult = (rows: Record<string, unknown>[]) =>
  ({ rows, columns: { predefined: [], dynamic: [], unmatched: [] } }) as CsvImportResult

const read = async (result: CsvImportResult, type: Parameters<typeof rowsToCsvFile>[1]) =>
  (await rowsToCsvFile(result, type).text()).split("\r\n")

describe("rowsToCsvFile", () => {
  test("emits the canonical header row the backend maps against", async () => {
    const [header] = await read(asResult([]), "menu_items")
    expect(header).toBe(
      '"Title","Price","Cost","Category","Freshness Window","Description"'
    )
  })

  test("escapes quotes, commas and newlines rather than breaking the row", async () => {
    const [, row] = await read(
      asResult([{ Title: 'The "Big" One, Jr.', Description: "line1\nline2" }]),
      "menu_items"
    )
    expect(row).toBe(
      '"The ""Big"" One, Jr.","","","","","line1\nline2"'
    )
  })

  test("unmapped and extra fields become empty cells, never shifted columns", async () => {
    const [header, row] = await read(
      asResult([{ Title: "Koshari", Price: 45, NotAColumn: "dropped" }]),
      "menu_items"
    )
    // Same field count on both lines is what keeps the backend's positional
    // parse aligned when a manager leaves optional columns unmapped.
    expect(row.split('","').length).toBe(header.split('","').length)
    expect(row).toBe('"Koshari","45","","","",""')
  })

  test("null and undefined serialize as empty, not as the literal words", async () => {
    const [, row] = await read(
      asResult([{ Title: null, Price: undefined, Cost: 0 }]),
      "menu_items"
    )
    expect(row).toBe('"","","0","","",""')
  })

  test("every import type has columns with unique ids", () => {
    for (const type of IMPORT_TYPES) {
      const ids = IMPORT_COLUMNS[type].map((column) => column.id)
      expect(ids.length).toBeGreaterThan(0)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})
