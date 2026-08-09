"use server"

import { getMyOrders } from "@/features/orders/api"
import type {
  PaginatedSelectFetchParams,
  PaginatedSelectFetchResult,
  PaginatedSelectOption,
} from "@/components/ui/paginated-select"

/**
 * Server action that returns paginated order options for the logged-in customer.
 * Used by the ContactWidget with PaginatedSelect (which wraps this in TanStack Query).
 */
export async function fetchMyOrderSummaries(
  params: PaginatedSelectFetchParams
): Promise<PaginatedSelectFetchResult> {
  try {
    const page = params.page || 1
    const limit = params.limit || 5
    const res = await getMyOrders({ page, limit })

    let data = res.data
    if (params.search?.trim()) {
      // Strip leading '#' character so searching '#6a77' matches '6a77...'
      const q = params.search.trim().toLowerCase().replace(/^#/, "")
      if (q) {
        data = data.filter((o) => {
          const fullId = o.groupOrderId.toLowerCase()
          const shortId = o.groupOrderId.slice(-6).toLowerCase()
          const status = o.overallStatus.toLowerCase()
          return fullId.includes(q) || shortId.includes(q) || status.includes(q)
        })
      }
    }

    const items: PaginatedSelectOption[] = data.map((o) => ({
      value: o.groupOrderId,
      label: `#${o.groupOrderId.slice(-6).toUpperCase()}`,
      subLabel: `${o.overallStatus} • ${new Date(o.createdAt).toLocaleDateString()}`,
      badge: o.overallStatus,
    }))

    return {
      items,
      totalPages: res.totalPages || 1,
      total: res.totalItems || items.length,
    }
  } catch {
    return { items: [], totalPages: 1, total: 0 }
  }
}
