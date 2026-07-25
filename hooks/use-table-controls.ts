"use client"

import * as React from "react"

import { nextSortState, type SortDirection } from "@/components/ui/table-state"

export interface UseTableControlsOptions<TSort extends string = string> {
  initialLimit?: number
  initialSort?: TSort
  initialOrder?: SortDirection
}

/**
 * Pagination + sorting state for a dashboard table.
 *
 * Two behaviours are centralised here because getting them wrong is the usual
 * source of "empty page" bugs:
 *
 * Anything that changes the result set — a filter, a new page size, a new sort
 * column — resets the offset to page 1. Callers route filter changes through
 * `resetPage()` inside the change handler rather than an effect, so no
 * cascading render occurs.
 */
export function useTableControls<TSort extends string = string>({
  initialLimit = 10,
  initialSort,
  initialOrder = "desc",
}: UseTableControlsOptions<TSort> = {}) {
  const [page, setPage] = React.useState(1)
  const [limit, setLimitState] = React.useState(initialLimit)
  const [sortState, setSortState] = React.useState<{
    sort: TSort | undefined
    order: SortDirection
  }>({ sort: initialSort, order: initialOrder })

  const resetPage = React.useCallback(() => setPage(1), [])

  const setLimit = React.useCallback((nextLimit: number) => {
    setLimitState(nextLimit)
    setPage(1)
  }, [])

  const toggleSort = React.useCallback((field: string) => {
    setSortState((prev) => {
      const next = nextSortState(
        { sort: prev.sort ?? "", order: prev.order },
        field
      )
      return { sort: next.sort as TSort, order: next.order }
    })
    setPage(1)
  }, [])

  return {
    page,
    setPage,
    resetPage,
    limit,
    setLimit,
    sort: sortState.sort,
    order: sortState.order,
    toggleSort,
  }
}
