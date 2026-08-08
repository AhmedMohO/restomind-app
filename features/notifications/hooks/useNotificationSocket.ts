"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { notificationSocketService } from "../services/socket-service"
import type { UnreadCountData } from "../types"

const unreadCountKey = ["notifications", "unread-count"] as const

/**
 * Module-level flag: only one hook instance (the first to mount) actually
 * registers the socket listener.  All others are no-ops.  This prevents the
 * double-increment bug when both the header dropdown and NotificationsManager
 * mount their own `useNotifications()` instances.
 *
 * The listener updates ONLY the unread-count cache (shared, query-key based).
 * List-data caches depend on per-consumer query keys (filters, pagination), so
 * the socket listener invalidates all list queries broadly and lets each
 * consumer's `useQuery` refetch on its own schedule.
 */
let activeOwner: symbol | null = null

export function useNotificationSocket() {
  const queryClient = useQueryClient()
  const ownerRef = useRef<symbol | null>(null)

  useEffect(() => {
    // Another instance already owns the subscription — skip.
    if (activeOwner !== null) return

    const id = Symbol("notification-socket-owner")
    ownerRef.current = id
    activeOwner = id

    const unsubscribe = notificationSocketService.subscribe(() => {
      // Bump unread count by 1 — single write regardless of how many
      // useNotifications instances are mounted.
      queryClient.setQueryData<UnreadCountData>(unreadCountKey, (old) => ({
        count: (old?.count ?? 0) + 1,
      }))

      // Invalidate all notification list queries so whichever consumer is
      // active refetches (deduped by staleTime / refetchInterval).
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] })
    })

    return () => {
      unsubscribe()
      // Only release the lock if WE are the owner — guards against React
      // StrictMode double-mount where the cleanup of the first effect runs
      // after the second effect has already claimed ownership.
      if (activeOwner === id) {
        activeOwner = null
      }
      ownerRef.current = null
    }
  }, [queryClient])
}
