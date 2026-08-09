"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  CreateBatchesInput,
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

export const INVENTORY_QUERY_KEY = ["inventory"] as const
export const INGREDIENTS_QUERY_KEY = ["ingredients"] as const

const EMPTY_PAGINATED_RESPONSE = {
  items: [],
  total: 0,
  totalCount: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
}

// --- Batches Hooks ---

export function useInventoryBatches(params: GetBatchesParams = {}) {
  return useQuery<PaginatedBatches>({
    queryKey: [...INVENTORY_QUERY_KEY, "batches", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedBatches>(`/inventory/batches${qs}`)
      return res ?? EMPTY_PAGINATED_RESPONSE
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: CreateBatchInput | CreateBatchInput[] | CreateBatchesInput
    ) => {
      const res = await clientFetch<InventoryBatch | InventoryBatch[]>("/inventory/batches", {
        method: "POST",
        body: input as unknown as Record<string, unknown>,
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })
}

// --- Stock Transactions Hooks ---

export function useStockTransactions(params: GetStockTransactionsParams = {}) {
  return useQuery<PaginatedStockTransactions>({
    queryKey: [...INVENTORY_QUERY_KEY, "transactions", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedStockTransactions>(`/inventory/transactions${qs}`)
      return res ?? EMPTY_PAGINATED_RESPONSE
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateStockTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStockTransactionInput) => {
      const res = await clientFetch<StockTransaction>("/inventory/transactions", {
        method: "POST",
        body: input as unknown as Record<string, unknown>,
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })
}

// --- Waste Events Hooks ---

export function useWasteEvents(params: GetWasteEventsParams = {}) {
  return useQuery<PaginatedWasteEvents>({
    queryKey: [...INVENTORY_QUERY_KEY, "waste-events", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedWasteEvents>(`/inventory/waste-events${qs}`)
      return res ?? EMPTY_PAGINATED_RESPONSE
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useCreateWasteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateWasteEventInput) => {
      const res = await clientFetch<WasteEvent>("/inventory/waste-events", {
        method: "POST",
        body: input as unknown as Record<string, unknown>,
      })
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })
}
