import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type { ApiSupplier, CreateSupplierPayload, GetSuppliersParams, PaginatedSuppliers } from "../types"

export * from "../types"

/** GET /suppliers — paginated list of suppliers for manager */
export async function getSuppliers(
  params: GetSuppliersParams = {}
): Promise<PaginatedSuppliers> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/suppliers${qs}`)
  return parseOrThrow<PaginatedSuppliers>(response, "getSuppliers")
}

/** POST /suppliers — create supplier */
export async function createSupplier(
  payload: CreateSupplierPayload
): Promise<ApiSupplier> {
  const response = await apiClient("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const resData = await parseOrThrow<{ data?: ApiSupplier } | ApiSupplier>(
    response,
    "createSupplier"
  )
  return "data" in resData && resData.data ? resData.data : (resData as ApiSupplier)
}

