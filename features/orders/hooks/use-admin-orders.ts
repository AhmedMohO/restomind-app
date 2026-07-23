"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
} from "@/features/orders/api/type"
import type {
  PaginatedAdminOrders,
  QueryOrderListingParams,
} from "@/features/orders/api/dashboard-types"

export const ADMIN_ORDERS_QUERY_KEY = ["orders", "admin", "list"] as const
export const ADMIN_ORDER_GROUP_QUERY_KEY = ["orders", "admin", "group"] as const

function buildQuery(params: QueryOrderListingParams): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

export function useAdminOrdersList(params: QueryOrderListingParams = {}) {
  const queryKey = [...ADMIN_ORDERS_QUERY_KEY, params] as const

  return useQuery<PaginatedAdminOrders>({
    queryKey,
    queryFn: async () => {
      const data = await clientFetch<PaginatedAdminOrders>(
        `/orders${buildQuery(params)}`
      )
      return (
        data ?? {
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: params.page ?? 1,
          pageSize: params.limit ?? 10,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      )
    },
    staleTime: 30 * 1000,
  })
}

export function useAdminOrderGroup(orderGroupId: string) {
  return useQuery<ApiOrderGroup>({
    queryKey: [...ADMIN_ORDER_GROUP_QUERY_KEY, orderGroupId] as const,
    queryFn: async () => {
      const data = await clientFetch<ApiOrderGroup>(
        `/orders/group/${encodeURIComponent(orderGroupId)}`
      )
      if (!data) throw new Error("Order group not found")
      return data
    },
    enabled: Boolean(orderGroupId),
    staleTime: 20 * 1000,
  })
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const data = await clientFetch<ApiRestaurantOrder>(`/orders/${id}/status`, {
        method: "PATCH",
        body: { status },
      })
      if (!data) throw new Error("Failed to update order status")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDER_GROUP_QUERY_KEY })
    },
  })
}
