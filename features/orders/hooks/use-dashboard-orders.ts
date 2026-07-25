"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiOrderGroup,
  ApiRestaurantOrder,
  OrderStatus,
  PaginatedResponse,
} from "@/features/orders/api/type"
import type {
  DashboardOrderRow,
  DashboardOrdersSummary,
  QueryOrderListingParams,
} from "@/features/orders/api/dashboard-types"

export const DASHBOARD_ORDERS_QUERY_KEY = ["orders", "dashboard"] as const

const LIST_KEY = [...DASHBOARD_ORDERS_QUERY_KEY, "list"] as const
const SUMMARY_KEY = [...DASHBOARD_ORDERS_QUERY_KEY, "summary"] as const
const GROUP_KEY = [...DASHBOARD_ORDERS_QUERY_KEY, "group"] as const

const EMPTY_PAGE: PaginatedResponse<DashboardOrderRow> = {
  data: [],
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 10,
  hasNextPage: false,
  hasPreviousPage: false,
}

/**
 * Order listing for the dashboard. The BFF scopes the result to the caller's
 * role, so admins, managers and staff all use this single hook.
 */
export function useDashboardOrders(params: QueryOrderListingParams = {}) {
  return useQuery<PaginatedResponse<DashboardOrderRow>>({
    queryKey: [...LIST_KEY, params] as const,
    queryFn: async () => {
      const data = await clientFetch<PaginatedResponse<DashboardOrderRow>>(
        `/orders${buildQueryString(params)}`
      )
      return data ?? EMPTY_PAGE
    },
    staleTime: 30 * 1000,
  })
}

/** Completed-vs-total counters for the same filters as `useDashboardOrders`. */
export function useDashboardOrdersSummary(params: QueryOrderListingParams = {}) {
  return useQuery<DashboardOrdersSummary>({
    queryKey: [...SUMMARY_KEY, params] as const,
    queryFn: async () => {
      const data = await clientFetch<DashboardOrdersSummary>(
        `/orders/summary${buildQueryString(params)}`
      )
      return data ?? { total: 0, done: 0 }
    },
    staleTime: 30 * 1000,
  })
}

/** Group details, already scoped to the caller's restaurant when applicable. */
export function useDashboardOrderGroup(orderGroupId: string) {
  return useQuery<ApiOrderGroup>({
    queryKey: [...GROUP_KEY, orderGroupId] as const,
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

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      groupOrderId,
    }: {
      id: string
      status: OrderStatus
      groupOrderId?: string
    }) => {
      const data = await clientFetch<ApiRestaurantOrder>(
        `/orders/${encodeURIComponent(id)}/status${buildQueryString({ groupOrderId })}`,
        { method: "PATCH", body: { status } }
      )
      if (!data) throw new Error("Failed to update order status")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_ORDERS_QUERY_KEY })
    },
  })
}
