import "server-only"

import { apiClient } from "@/lib/api/client"
import { buildQueryString, parseOrThrow } from "@/lib/api/utils"
import type {
  NotificationItem,
  NotificationQuery,
  PaginatedNotifications,
  UnreadCountData,
} from "../types"

/** GET /notifications/unread-count - Unread count for authenticated user */
export async function getUnreadCountServer(): Promise<{ success: boolean; data: UnreadCountData }> {
  const response = await apiClient("/notifications/unread-count")
  return parseOrThrow<{ success: boolean; data: UnreadCountData }>(
    response,
    "getUnreadCountServer"
  )
}

/** GET /notifications/unread - Unread notifications listing */
export async function getUnreadNotificationsServer(
  query: NotificationQuery = {}
): Promise<PaginatedNotifications> {
  const qs = buildQueryString(query)
  const response = await apiClient(`/notifications/unread${qs}`)
  return parseOrThrow<PaginatedNotifications>(
    response,
    "getUnreadNotificationsServer"
  )
}

/** GET /notifications - Paginated notifications list */
export async function getUserNotificationsServer(
  query: NotificationQuery = {}
): Promise<PaginatedNotifications> {
  const qs = buildQueryString(query)
  const response = await apiClient(`/notifications${qs}`)
  return parseOrThrow<PaginatedNotifications>(
    response,
    "getUserNotificationsServer"
  )
}

/** PATCH /notifications/read-all - Mark all user notifications read */
export async function markAllAsReadServer(): Promise<{ message: string }> {
  const response = await apiClient("/notifications/read-all", {
    method: "PATCH",
  })
  return parseOrThrow<{ message: string }>(response, "markAllAsReadServer")
}

/** PATCH /notifications/:id/read - Mark single notification read */
export async function markAsReadServer(
  id: string
): Promise<{ data: NotificationItem }> {
  const response = await apiClient(`/notifications/${id}/read`, {
    method: "PATCH",
  })
  return parseOrThrow<{ data: NotificationItem }>(response, "markAsReadServer")
}

/** DELETE /notifications/:id - Delete single notification */
export async function deleteNotificationServer(
  id: string
): Promise<{ message: string }> {
  const response = await apiClient(`/notifications/${id}`, {
    method: "DELETE",
  })
  return parseOrThrow<{ message: string }>(response, "deleteNotificationServer")
}
