import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type { GetSuppliersParams, PaginatedSuppliers } from "../types"

export * from "../types"

/** GET /suppliers — paginated list of suppliers for manager */
export async function getSuppliers(
  params: GetSuppliersParams = {}
): Promise<PaginatedSuppliers> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/suppliers${qs}`)
  return parseOrThrow<PaginatedSuppliers>(response, "getSuppliers")
}
