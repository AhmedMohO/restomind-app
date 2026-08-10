import type { Column, ImportResult as CsvImportResult } from "@importcsv/react"

import type { ImportType } from "@/features/imports/api/type"

/**
 * The import "template" — one `Column` per canonical backend field, used by
 * the optional `CSVImporter` mapping wizard (see `import-workspace.tsx`).
 *
 * `id` is deliberately the exact CSV header string we emit back out, not a
 * camelCase key: `rowsToCsvFile` writes `columns.map(c => c.id)` as the
 * header row, so the file handed to `POST /imports` already speaks the
 * backend's vocabulary and `CsvParsingService.autoSuggestMapping` matches
 * it 1:1. That removes any second mapping layer between this file and the
 * server — there is exactly one place a header string is written down.
 *
 * The ids below are each the first alias of a group in
 * `IMPORT_TYPE_CONFIG.headers` (`import-type-config.ts`); the *other*
 * aliases in those groups are what a manager's own file may say, and are
 * what the wizard's mapping step resolves from. Because the backend
 * lower-cases and strips non-alphanumerics before matching, the natural
 * casing/spacing here is safe.
 *
 * NOTE ON `required`: only fields that are structurally necessary to
 * identify or price a row are marked required, because the authoritative
 * per-field rules live in the sibling backend repo's DTOs (RestoMindAPI),
 * not here. Marking a field required that the backend accepts as optional
 * would block an otherwise valid import at the wizard, before the server
 * ever sees it — the failure mode is silent and user-facing, so this errs
 * toward permissive and lets the backend stay the single validator.
 */
export const IMPORT_COLUMNS: Record<ImportType, Column[]> = {
  menu_items: [
    {
      id: "Title",
      label: "Title",
      type: "string",
      description: "The dish name as it appears on the menu",
      validators: [{ type: "required" }, { type: "unique" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Price",
      label: "Selling price",
      type: "number",
      validators: [{ type: "required" }, { type: "min", value: 0 }],
    },
    {
      id: "Cost",
      label: "Cost",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
    {
      id: "Category",
      label: "Category",
      type: "string",
      transformations: [{ type: "trim" }],
    },
    {
      id: "Freshness Window",
      label: "Freshness window (hours)",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
    {
      id: "Description",
      label: "Description",
      type: "string",
      transformations: [{ type: "trim" }],
    },
  ],

  ingredients: [
    {
      id: "Name",
      label: "Ingredient name",
      type: "string",
      validators: [{ type: "required" }, { type: "unique" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Ingredient Code",
      label: "Code / SKU",
      type: "string",
      validators: [{ type: "unique" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Unit",
      label: "Unit of measure",
      type: "string",
      description: "e.g. kg, g, l, ml, pcs",
      validators: [{ type: "required" }],
      transformations: [{ type: "trim" }, { type: "lowercase" }],
    },
    {
      id: "Shelf Life Days",
      label: "Shelf life (days)",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
    {
      id: "Minimum Stock",
      label: "Minimum stock",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
  ],

  recipes: [
    {
      id: "Product ID",
      label: "Menu item",
      type: "string",
      description: "Must already exist — import menu items first",
      validators: [{ type: "required" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Ingredient ID",
      label: "Ingredient",
      type: "string",
      description: "Must already exist — import ingredients first",
      validators: [{ type: "required" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Quantity Per Portion",
      label: "Quantity per portion",
      type: "number",
      validators: [{ type: "required" }, { type: "min", value: 0 }],
    },
    {
      id: "Unit",
      label: "Unit of measure",
      type: "string",
      transformations: [{ type: "trim" }, { type: "lowercase" }],
    },
    {
      id: "Yield Percentage",
      label: "Yield %",
      type: "number",
      validators: [
        { type: "min", value: 0 },
        { type: "max", value: 100 },
      ],
    },
  ],

  inventory_transactions: [
    {
      id: "Ingredient ID",
      label: "Ingredient",
      type: "string",
      description: "Must already exist — import ingredients first",
      validators: [{ type: "required" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Batch Number",
      label: "Batch / lot number",
      type: "string",
      transformations: [{ type: "trim" }],
    },
    {
      id: "Quantity",
      label: "Quantity",
      type: "number",
      validators: [{ type: "required" }, { type: "min", value: 0 }],
    },
    {
      id: "Unit Cost",
      label: "Unit cost",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
    {
      id: "Expiry Date",
      label: "Expiry date",
      type: "date",
      transformations: [{ type: "normalize_date", format: "yyyy-MM-dd" }],
    },
    {
      id: "Unit",
      label: "Unit of measure",
      type: "string",
      transformations: [{ type: "trim" }, { type: "lowercase" }],
    },
    {
      id: "Transaction Type",
      label: "Transaction type",
      type: "string",
      transformations: [{ type: "trim" }, { type: "lowercase" }],
    },
  ],

  sales_history: [
    {
      id: "Date",
      label: "Sale date",
      type: "date",
      validators: [{ type: "required" }],
      transformations: [{ type: "normalize_date", format: "yyyy-MM-dd" }],
    },
    {
      id: "Product ID",
      label: "Menu item",
      type: "string",
      description: "Must already exist — import menu items first",
      validators: [{ type: "required" }],
      transformations: [{ type: "trim" }],
    },
    {
      id: "Quantity Sold",
      label: "Quantity sold",
      type: "number",
      validators: [{ type: "required" }, { type: "min", value: 0 }],
    },
    {
      id: "Production Quantity",
      label: "Production quantity",
      type: "number",
      validators: [{ type: "required" }, { type: "min", value: 0 }],
    },
    {
      id: "Selling Price",
      label: "Selling price",
      type: "number",
      validators: [{ type: "min", value: 0 }],
    },
    {
      id: "Offer ID",
      label: "Offer",
      type: "string",
      transformations: [{ type: "trim" }],
    },
  ],
}

/** RFC 4180 quoting: wrap every field, double any embedded quote. */
const escapeCsvValue = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`

/**
 * Re-serializes the wizard's mapped rows into a CSV `File` for the existing
 * `POST /imports` -> `POST /imports/:id/confirm` chain.
 *
 * This is the whole reason adding `CSVImporter` doesn't disturb anything:
 * `useImportUpload` takes a `File` and the backend takes multipart, but
 * `onComplete` hands back parsed objects. Rather than teach the hook or the
 * server about a JSON path, we convert back to the one format both already
 * speak. `useImportUpload`, the error classifier, and the history list are
 * untouched.
 *
 * Only `IMPORT_COLUMNS[type]` ids are emitted, in order — anything the user
 * left unmapped becomes an empty cell rather than a missing column, so the
 * header row is identical for every file of a given type. `_custom_fields`
 * and `_unmatched` are intentionally dropped: the backend has a fixed
 * schema per import type and would reject unknown columns.
 */
export function rowsToCsvFile(
  result: CsvImportResult,
  importType: ImportType
): File {
  const headers = IMPORT_COLUMNS[importType].map((column) => column.id)
  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...result.rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ].join("\r\n")

  return new File([csv], `${importType}.csv`, { type: "text/csv" })
}
