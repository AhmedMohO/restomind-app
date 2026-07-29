import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiPurchaseOrder,
  CreatePurchaseOrderInput,
  GetPurchaseOrdersParams,
  PaginatedPurchaseOrders,
  PurchaseOrderStatus,
} from "../types"

export const PURCHASE_ORDERS_QUERY_KEY = ["purchase-orders"] as const

export function usePurchaseOrdersList(params: GetPurchaseOrdersParams = {}) {
  return useQuery<PaginatedPurchaseOrders>({
    queryKey: [...PURCHASE_ORDERS_QUERY_KEY, "list", params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const res = await clientFetch<PaginatedPurchaseOrders>(`/purchase-orders${qs}`)
      return res ?? { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
    },
    staleTime: 30 * 1000,
  })
}

export function usePurchaseOrderById(id: string | null) {
  return useQuery<ApiPurchaseOrder | null>({
    queryKey: [...PURCHASE_ORDERS_QUERY_KEY, "details", id],
    queryFn: async () => {
      if (!id) return null
      // Get from list endpoint with high limit if needed or fetch
      const res = await clientFetch<PaginatedPurchaseOrders>(`/purchase-orders?limit=100`)
      const found = res?.items?.find((item) => item._id === id)
      return found ?? null
    },
    enabled: Boolean(id),
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderInput) => {
      const res = await clientFetch<ApiPurchaseOrder>("/purchase-orders", {
        method: "POST",
        body: data as unknown as Record<string, unknown>,
      })
      return res as ApiPurchaseOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY })
    },
  })
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await clientFetch<ApiPurchaseOrder>(`/purchase-orders/${id}/receive`, {
        method: "PATCH",
      })
      return res as ApiPurchaseOrder
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...PURCHASE_ORDERS_QUERY_KEY, "details", id],
      })
      // Receiving a PO creates inventory batches & stock transactions — invalidate them too
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: PurchaseOrderStatus
    }) => {
      const res = await clientFetch<ApiPurchaseOrder>(`/purchase-orders/${id}/status`, {
        method: "PATCH",
        body: { status },
      })
      return res as ApiPurchaseOrder
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...PURCHASE_ORDERS_QUERY_KEY, "details", variables.id],
      })
      // Status change to "received" triggers batch creation on backend
      if (variables.status === "received") {
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
      }
    },
  })
}
