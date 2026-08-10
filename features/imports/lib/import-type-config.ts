import type { ImportType } from "@/features/imports/api/type"

/**
 * Onboarding order + the recognized-header hints shown in the type picker
 * (brief Step 2: "showing the accepted headers up front is what prevents
 * most failed imports").
 *
 * `headers` is sourced directly from `CsvParsingService.autoSuggestMapping`
 * in the sibling backend repo (`RestoMindAPI/src/imports/services/
 * csv-parsing.service.ts`), read on 2026-07-30. That function lower-cases
 * and strips non-alphanumeric characters before matching (`header.
 * toLowerCase().replace(/[^a-z0-9]/g, '')`), so "Product Name",
 * "product_name" and "productname" are all accepted as the same alias —
 * the strings below use natural casing/spacing for readability; any of
 * those variants matches.
 *
 * `prerequisites` encodes the same dependency order the backend enforces
 * in `ImportsService.confirmImport` (recipes needs menu_items AND
 * ingredients; inventory_transactions needs ingredients; sales_history
 * needs menu_items) — used to render the "Needs X first" hint and to
 * resolve the prerequisite type a violation error should link to.
 */
export interface ImportTypeConfig {
  type: ImportType
  order: number
  prerequisites: ImportType[]
  headers: string[]
}

export const IMPORT_TYPE_CONFIG: ImportTypeConfig[] = [
  {
    type: "menu_items",
    order: 1,
    prerequisites: [],
    headers: [
      "Title",
      "Name",
      "Product Name",
      "Item Name",
      "Product Title",
      "Price",
      "Selling Price",
      "Unit Price",
      "Cost",
      "Category",
      "Freshness Window",
      "Description",
    ],
  },
  {
    type: "ingredients",
    order: 2,
    prerequisites: [],
    headers: [
      "Name",
      "Ingredient Name",
      "Ingredient Code",
      "SKU",
      "Unit",
      "UOM",
      "Shelf Life Days",
      "Minimum Stock",
      "Safety Stock",
    ],
  },
  {
    type: "recipes",
    order: 3,
    prerequisites: ["menu_items", "ingredients"],
    headers: [
      "Product ID",
      "Product",
      "Item",
      "Ingredient ID",
      "Ingredient",
      "Ingredient Code",
      "Quantity Per Portion",
      "Quantity",
      "Unit",
      "Yield Percentage",
    ],
  },
  {
    type: "inventory_transactions",
    order: 4,
    prerequisites: ["ingredients"],
    headers: [
      "Ingredient ID",
      "Ingredient",
      "Ingredient Code",
      "Batch Number",
      "Batch",
      "Lot",
      "Quantity",
      "Unit Cost",
      "Expiry Date",
      "Unit",
      "Transaction Type",
    ],
  },
  {
    type: "sales_history",
    order: 5,
    prerequisites: ["menu_items"],
    headers: [
      "Date",
      "Sale Date",
      "Product ID",
      "Product",
      "Item Code",
      "Quantity Sold",
      "Quantity",
      "Units Sold",
      "Production Quantity",
      "Production Qty",
      "production_qty",
      "Produced Qty",
      "Production",
      "Selling Price",
      "Price",
      "Base Price",
      "Offer ID",
    ],
  },
]

export function getImportTypeConfig(type: ImportType): ImportTypeConfig {
  const config = IMPORT_TYPE_CONFIG.find((c) => c.type === type)
  if (!config) throw new Error(`Unknown import type: ${type}`)
  return config
}
