import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  NotificationItem,
  NotificationQuery,
  PaginatedNotifications,
  UnreadCountData,
} from "../types"

/**
 * Clean Object-Oriented Notification Service
 * Encapsulates client-side interactions with backend notification endpoints.
 */
export class NotificationService {
  private static instance: NotificationService

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Fetch badge count of unread notifications
   */
  public async getUnreadCount(): Promise<UnreadCountData> {
    const data = await clientFetch<UnreadCountData>("/api/notifications/unread-count")
    return data ?? { count: 0 }
  }

  /**
   * Fetch list of unread notifications with optional pagination
   */
  public async getUnreadNotifications(
    query: NotificationQuery = {}
  ): Promise<PaginatedNotifications> {
    const qs = buildQueryString(query)
    const data = await clientFetch<PaginatedNotifications>(
      `/api/notifications/unread${qs}`
    )
    return (
      data ?? {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      }
    )
  }

  /**
   * Fetch paginated user notifications with filtering and sorting
   */
  public async getUserNotifications(
    query: NotificationQuery = {}
  ): Promise<PaginatedNotifications> {
    const qs = buildQueryString(query)
    const data = await clientFetch<PaginatedNotifications>(
      `/api/notifications${qs}`
    )
    return (
      data ?? {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      }
    )
  }

  /**
   * Mark all unread notifications as read for current user
   */
  public async markAllAsRead(): Promise<{ message: string }> {
    const data = await clientFetch<{ message: string }>(
      "/api/notifications/read-all",
      {
        method: "PATCH",
      }
    )
    return data ?? { message: "All notifications marked as read" }
  }

  /**
   * Mark single notification as read by ID
   */
  public async markAsRead(id: string): Promise<NotificationItem | undefined> {
    return clientFetch<NotificationItem>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    })
  }

  /**
   * Delete single notification by ID
   */
  public async deleteNotification(id: string): Promise<{ message: string }> {
    const data = await clientFetch<{ message: string }>(
      `/api/notifications/${id}`,
      {
        method: "DELETE",
      }
    )
    return data ?? { message: "Notification deleted successfully" }
  }
}

export const notificationService = NotificationService.getInstance()
