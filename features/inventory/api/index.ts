import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  CreateBatchInput,
  CreateStockTransactionInput,
  CreateWasteEventInput,
  GetBatchesParams,
  GetStockTransactionsParams,
  GetWasteEventsParams,
  InventoryBatch,
  PaginatedBatches,
  PaginatedStockTransactions,
  PaginatedWasteEvents,
  StockTransaction,
  WasteEvent,
} from "../types"

export * from "../types"

/** GET /inventory/batches — paginated list of batches */
export async function getBatches(
  params: GetBatchesParams = {}
): Promise<PaginatedBatches> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/inventory/batches${qs}`)
  return parseOrThrow<PaginatedBatches>(response, "getBatches")
}

/** POST /inventory/batches — create single or multiple inventory batches */
export async function createBatch(
  data: CreateBatchInput | CreateBatchInput[]
): Promise<{ data: InventoryBatch | InventoryBatch[]; count?: number }> {
  const response = await apiClient("/inventory/batches", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: InventoryBatch | InventoryBatch[]; count?: number }>(
    response,
    "createBatch"
  )
}

/** GET /inventory/transactions — paginated list of stock transactions */
export async function getStockTransactions(
  params: GetStockTransactionsParams = {}
): Promise<PaginatedStockTransactions> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/inventory/transactions${qs}`)
  return parseOrThrow<PaginatedStockTransactions>(response, "getStockTransactions")
}

/** POST /inventory/transactions — create stock transaction */
export async function createStockTransaction(
  data: CreateStockTransactionInput
): Promise<{ data: StockTransaction }> {
  const response = await apiClient("/inventory/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: StockTransaction }>(response, "createStockTransaction")
}

/** GET /inventory/waste-events — paginated list of waste events */
export async function getWasteEvents(
  params: GetWasteEventsParams = {}
): Promise<PaginatedWasteEvents> {
  const qs = buildQueryString(params)
  const response = await apiClient(`/inventory/waste-events${qs}`)
  return parseOrThrow<PaginatedWasteEvents>(response, "getWasteEvents")
}

/** POST /inventory/waste-events — log waste event */
export async function createWasteEvent(
  data: CreateWasteEventInput
): Promise<{ data: WasteEvent }> {
  const response = await apiClient("/inventory/waste-events", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return parseOrThrow<{ data: WasteEvent }>(response, "createWasteEvent")
}
