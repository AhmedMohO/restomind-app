export enum NotificationType {
  NEW_ORDER = 'NEW_ORDER',
  NEW_PARTNERSHIP_APPLICATION = 'NEW_PARTNERSHIP_APPLICATION',
}

export interface NotificationItem {
  id: string
  type: NotificationType | string
  title: string
  message: string
  relatedEntityId?: string
  relatedEntityType?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface NotificationQuery {
  page?: number
  limit?: number
  isRead?: boolean
  type?: string
  createdAfter?: string
  createdBefore?: string
  sortBy?: 'createdAt' | 'readAt'
  order?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PaginatedNotifications {
  data: NotificationItem[]
  pagination: PaginationMeta
}

export interface UnreadCountData {
  count: number
}
