"use client"

import { useCallback, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "../services/notification-service"
import { notificationSocketService } from "../services/socket-service"
import type {
  NotificationQuery,
  PaginatedNotifications,
  PaginationMeta,
  UnreadCountData,
} from "../types"

interface UseNotificationsOptions {
  initialQuery?: NotificationQuery
  autoFetchOnMount?: boolean
}

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
}

const listKey = (query: NotificationQuery) => ["notifications", "list", query] as const
const unreadCountKey = ["notifications", "unread-count"] as const

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { initialQuery = { page: 1, limit: 10 }, autoFetchOnMount = true } = options
  const queryClient = useQueryClient()

  // `initialQuery` is only read on mount by design — callers change the
  // query via `fetchNotifications(overrideQuery)`, which react-query keys
  // off of directly, matching the previous hook's external contract.
  const activeQuery = initialQuery

  const listQuery = useQuery({
    queryKey: listKey(activeQuery),
    queryFn: () => notificationService.getUserNotifications(activeQuery),
    enabled: autoFetchOnMount,
  })

  const unreadCountQuery = useQuery({
    queryKey: unreadCountKey,
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000,
  })

  const notifications = listQuery.data?.data ?? []
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION
  const unreadCount = unreadCountQuery.data?.count ?? 0

  const fetchUnreadCount = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: unreadCountKey })
  }, [queryClient])

  const fetchNotifications = useCallback(
    async (overrideQuery?: NotificationQuery) => {
      const nextQuery = { ...activeQuery, ...overrideQuery }
      await queryClient.fetchQuery({
        queryKey: listKey(nextQuery),
        queryFn: () => notificationService.getUserNotifications(nextQuery),
      })
      // Every list refetch previously also refreshed the count; keep that
      // behavior (filters/pagination don't change the count, but marking
      // read/deleting elsewhere might have — cheap, deduped by staleTime).
      await fetchUnreadCount()
    },
    [activeQuery, queryClient, fetchUnreadCount]
  )

  const markAsRead = useCallback(
    async (id: string) => {
      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
        old
          ? {
              ...old,
              data: old.data.map((item) =>
                item.id === id
                  ? { ...item, isRead: true, readAt: new Date().toISOString() }
                  : item
              ),
            }
          : old
      )
      queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old
      )
      try {
        await notificationService.markAsRead(id)
      } catch (err) {
        console.error(`[useNotifications] markAsRead failed for ${id}`, err)
        await fetchUnreadCount()
      }
    },
    [queryClient, activeQuery, fetchUnreadCount]
  )

  const markAllAsRead = useCallback(async () => {
    queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
      old
        ? { ...old, data: old.data.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })) }
        : old
    )
    queryClient.setQueryData<UnreadCountData>(unreadCountKey, { count: 0 })
    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error("[useNotifications] markAllAsRead failed", err)
      await fetchUnreadCount()
    }
  }, [queryClient, activeQuery, fetchUnreadCount])

  const deleteNotification = useCallback(
    async (id: string) => {
      const current = queryClient.getQueryData<PaginatedNotifications>(listKey(activeQuery))
      const target = current?.data.find((item) => item.id === id)

      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) =>
        old ? { ...old, data: old.data.filter((item) => item.id !== id) } : old
      )
      if (target && !target.isRead) {
        queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) =>
          old ? { count: Math.max(0, old.count - 1) } : old
        )
      }

      try {
        await notificationService.deleteNotification(id)
      } catch (err) {
        console.error(`[useNotifications] deleteNotification failed for ${id}`, err)
        await fetchNotifications()
      }
    },
    [queryClient, activeQuery, fetchNotifications]
  )

  // Subscribe to live WebSocket notifications — updates the shared cache
  // directly so every mounted consumer (dropdown + manager page) sees the
  // same update without each running its own subscription-driven refetch.
  useEffect(() => {
    const unsubscribe = notificationSocketService.subscribe((incoming) => {
      queryClient.setQueryData<PaginatedNotifications>(listKey(activeQuery), (old) => {
        if (!old) return old
        if (old.data.some((item) => item.id === incoming.id)) return old
        if (activeQuery.type && incoming.type !== activeQuery.type) return old
        if (activeQuery.isRead === true) return old
        return {
          ...old,
          data: [incoming, ...old.data],
          pagination: { ...old.pagination, totalItems: old.pagination.totalItems + 1 },
        }
      })
      queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) => ({
        count: (old?.count ?? 0) + 1,
      }))
    })

    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, activeQuery.type, activeQuery.isRead])

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching && !listQuery.isLoading,
    error: listQuery.error instanceof Error ? listQuery.error.message : null,
    query: activeQuery,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: listKey(activeQuery) }).then(fetchUnreadCount),
  }
}
