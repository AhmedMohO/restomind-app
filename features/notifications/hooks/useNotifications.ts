"use client"

import { useCallback } from "react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "../services/notification-service"
import { useNotificationSocket } from "./useNotificationSocket"
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

  // Wire the global socket subscription — only the first mounted instance
  // actually subscribes; subsequent mounts are no-ops.  This prevents the
  // double-increment bug where multiple hook instances each bumped the count.
  useNotificationSocket()

  const listQuery = useQuery({
    queryKey: listKey(activeQuery),
    queryFn: () => notificationService.getUserNotifications(activeQuery),
    enabled: autoFetchOnMount,
    // Keep the previous page's data visible while the next page loads,
    // preventing an empty-list flash on pagination / filter changes.
    placeholderData: keepPreviousData,
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
      // Count is only invalidated when an action actually changes it
      // (mark-as-read, delete, socket notification) — not on every list
      // refetch.  invalidateQueries bypasses staleTime, so the old
      // unconditional call here caused the count to refetch on every
      // pagination / filter click, defeating the 30s staleTime.
    },
    [activeQuery, queryClient]
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

  // Socket subscription is handled globally by useNotificationSocket() above.
  // It bumps the unread count once and invalidates list queries so each
  // consumer's useQuery refetches on its own.

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
