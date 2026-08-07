"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { notificationService } from "../services/notification-service"
import { notificationSocketService } from "../services/socket-service"
import type {
  NotificationItem,
  NotificationQuery,
  PaginationMeta,
} from "../types"

interface UseNotificationsOptions {
  initialQuery?: NotificationQuery
  autoFetchOnMount?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    initialQuery = { page: 1, limit: 10 },
    autoFetchOnMount = true,
  } = options

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: initialQuery.page || 1,
    limit: initialQuery.limit || 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(autoFetchOnMount)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<NotificationQuery>(initialQuery)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /** Fetch badge unread count */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount()
      if (isMountedRef.current) {
        setUnreadCount(res.count)
      }
    } catch (err) {
      console.error("[useNotifications] fetchUnreadCount failed", err)
    }
  }, [])

  /** Fetch notifications list */
  const fetchNotifications = useCallback(
    async (overrideQuery?: NotificationQuery, isBackground = false) => {
      const activeQuery = { ...query, ...overrideQuery }
      if (!isBackground) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      try {
        const res = await notificationService.getUserNotifications(activeQuery)
        if (isMountedRef.current) {
          setNotifications(res.data)
          setPagination(res.pagination)
          setQuery(activeQuery)
        }
        // Also sync unread count
        await fetchUnreadCount()
      } catch (err) {
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load notifications"
          )
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [query, fetchUnreadCount]
  )

  /** Mark single notification read */
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic state update
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await notificationService.markAsRead(id)
    } catch (err) {
      console.error(`[useNotifications] markAsRead failed for ${id}`, err)
      // Revert if error occurs by re-fetching
      await fetchUnreadCount()
    }
  }, [fetchUnreadCount])

  /** Mark all notifications read */
  const markAllAsRead = useCallback(async () => {
    // Optimistic state update
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    )
    setUnreadCount(0)

    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error("[useNotifications] markAllAsRead failed", err)
      await fetchUnreadCount()
    }
  }, [fetchUnreadCount])

  /** Delete notification */
  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id)
      // Optimistic state update
      setNotifications((prev) => prev.filter((item) => item.id !== id))
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      try {
        await notificationService.deleteNotification(id)
      } catch (err) {
        console.error(`[useNotifications] deleteNotification failed for ${id}`, err)
        // Refetch on error
        await fetchNotifications()
      }
    },
    [notifications, fetchNotifications]
  )

  // Initial fetch on mount
  useEffect(() => {
    if (autoFetchOnMount) {
      fetchNotifications()
    } else {
      fetchUnreadCount()
    }
  }, [autoFetchOnMount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to live WebSocket notifications
  useEffect(() => {
    const unsubscribe = notificationSocketService.subscribe((incoming) => {
      if (!isMountedRef.current) return

      setNotifications((prev) => {
        // Prevent duplicate items
        if (prev.some((n) => n.id === incoming.id)) {
          return prev
        }
        // If query filters by type and types don't match, ignore in list
        if (query.type && incoming.type !== query.type) {
          return prev
        }
        // If query filters for read-only notifications, ignore unread item in list
        if (query.isRead === true) {
          return prev
        }
        return [incoming, ...prev]
      })

      setUnreadCount((prev) => prev + 1)
      setPagination((prev) => ({
        ...prev,
        totalItems: prev.totalItems + 1,
      }))
    })

    return () => {
      unsubscribe()
    }
  }, [query.isRead, query.type])

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isRefreshing,
    error,
    query,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => fetchNotifications(query, true),
  }
}
