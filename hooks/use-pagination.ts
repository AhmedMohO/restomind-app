"use client"

import { useCallback, useMemo } from "react"

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginationActions {
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setLimit: (limit: number) => void
  resetPage: () => void
}

export function usePagination(
  state: PaginationState,
  dispatch: (update: Partial<PaginationState>) => void
): PaginationState & PaginationActions {
  const { page, limit, total, totalPages } = state

  const setPage = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(p, totalPages))
      dispatch({ page: clamped })
    },
    [totalPages, dispatch]
  )

  const nextPage = useCallback(() => {
    if (page < totalPages) dispatch({ page: page + 1 })
  }, [page, totalPages, dispatch])

  const prevPage = useCallback(() => {
    if (page > 1) dispatch({ page: page - 1 })
  }, [page, dispatch])

  const setLimit = useCallback(
    (l: number) => {
      dispatch({ limit: l, page: 1 })
    },
    [dispatch]
  )

  const resetPage = useCallback(() => {
    dispatch({ page: 1 })
  }, [dispatch])

  const range = useMemo(() => {
    if (total === 0) return { from: 0, to: 0 }
    const from = (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    return { from, to }
  }, [page, limit, total])

  return {
    page,
    limit,
    total,
    totalPages,
    ...range,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    resetPage,
  }
}
