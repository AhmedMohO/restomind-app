"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  ShoppingBag,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { TablePagination } from "@/components/ui/table-pagination"
import { useNotifications } from "../hooks/useNotifications"
import { NotificationType, type NotificationItem, type NotificationQuery } from "../types"
import {
  NotificationFilterSheet,
  DEFAULT_NOTIFICATION_FILTERS,
} from "./notification-filter-sheet"

function getNotificationIcon(type: string) {
  switch (type) {
    case NotificationType.NEW_ORDER:
    case "NEW_ORDER":
      return {
        icon: ShoppingBag,
        bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        labelKey: "typeNewOrder",
      }
    case NotificationType.NEW_PARTNERSHIP_APPLICATION:
    case "NEW_PARTNERSHIP_APPLICATION":
      return {
        icon: FileText,
        bgColor: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20",
        labelKey: "typePartnership",
      }
    default:
      return {
        icon: Bell,
        bgColor: "bg-primary/10 text-primary border-primary/20",
        labelKey: "typeGeneral",
      }
  }
}

export function NotificationsManager() {
  const locale = useLocale()
  const isRtl = locale === "ar"
  const router = useRouter()
  const t = useTranslations("Dashboard.notifications")
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [advFilters, setAdvFilters] = useState<NotificationQuery>(DEFAULT_NOTIFICATION_FILTERS)

  const activeQuery: NotificationQuery = {
    page,
    limit,
    isRead: advFilters.isRead !== undefined ? advFilters.isRead : (filter === "unread" ? false : undefined),
    type: advFilters.type,
    createdAfter: advFilters.createdAfter,
    createdBefore: advFilters.createdBefore,
    sortBy: advFilters.sortBy,
    order: advFilters.order,
  }

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isRefreshing,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    initialQuery: activeQuery,
  })

  const handleFilterChange = (newFilter: "all" | "unread") => {
    setFilter(newFilter)
    setPage(1)
    const nextIsRead = newFilter === "unread" ? false : undefined
    setAdvFilters((prev) => ({ ...prev, isRead: nextIsRead }))
    fetchNotifications({
      ...activeQuery,
      page: 1,
      isRead: nextIsRead,
    })
  }

  const handleAdvFilterChange = <K extends keyof NotificationQuery>(
    key: K,
    value: NotificationQuery[K]
  ) => {
    const updated = { ...advFilters, [key]: value }
    setAdvFilters(updated)
    if (key === "isRead") {
      if (value === false) setFilter("unread")
      else if (value === undefined) setFilter("all")
    }
    setPage(1)
    fetchNotifications({
      ...activeQuery,
      [key]: value,
      page: 1,
    })
  }

  const handleAdvFilterReset = () => {
    setAdvFilters(DEFAULT_NOTIFICATION_FILTERS)
    setFilter("all")
    setPage(1)
    setLimit(10)
    fetchNotifications({
      page: 1,
      limit: 10,
      isRead: undefined,
      type: undefined,
      createdAfter: undefined,
      createdBefore: undefined,
      sortBy: "createdAt",
      order: "desc",
    })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchNotifications({
      ...activeQuery,
      page: newPage,
    })
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
    fetchNotifications({
      ...activeQuery,
      limit: newLimit,
      page: 1,
    })
  }

  const handleNavigate = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id)
    }

    if (item.type === NotificationType.NEW_ORDER || item.type === "NEW_ORDER") {
      router.push(`/${locale}/dashboard/orders`)
    } else if (
      item.type === NotificationType.NEW_PARTNERSHIP_APPLICATION ||
      item.type === "NEW_PARTNERSHIP_APPLICATION"
    ) {
      router.push(`/${locale}/dashboard/partnership-applications`)
    }
  }

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {t("title")}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {t("newBadge", { count: unreadCount })}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-9 gap-1.5 cursor-pointer"
            >
              <CheckCheck className="size-4" />
              <span>{t("markAllAsRead")}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={isRefreshing}
            className="h-9 w-9 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl shadow-sm border-border/80">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("all")}
              className="rounded-full px-4 text-xs font-medium cursor-pointer"
            >
              {t("filterAll")}
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange("unread")}
              className="rounded-full px-4 text-xs font-medium cursor-pointer gap-1.5"
            >
              <span>{t("filterUnread")}</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive-foreground/20 px-1.5 py-0.2 text-[10px]">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationFilterSheet
              filters={advFilters}
              onChange={handleAdvFilterChange}
              onReset={handleAdvFilterReset}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="rounded-2xl shadow-sm border-border/80 overflow-hidden">
        <CardHeader className="border-b border-border/60 p-4 bg-muted/20">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            <span>{isRtl ? "سجل الإشعارات" : "Notification Feed"}</span>
            <span>
              {isRtl ? `الإجمالي: ${pagination.totalItems}` : `Total: ${pagination.totalItems}`}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <AlertCircle className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {t("empty")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {t("emptyDesc")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {notifications.map((item) => {
                const { icon: Icon, bgColor, labelKey } = getNotificationIcon(item.type)
                const formattedDate = new Date(item.createdAt).toLocaleString(
                  isRtl ? "ar-EG" : "en-US",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors text-start hover:bg-muted/40",
                      !item.isRead && "bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={cn("p-2.5 rounded-xl border shrink-0 mt-0.5", bgColor)}>
                        <Icon className="size-5" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-base text-foreground">
                            {item.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-normal px-2">
                            {t(labelKey as any)}
                          </Badge>
                          {!item.isRead && (
                            <Badge variant="default" className="text-[10px] bg-primary">
                              {t("unreadBadge")}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.message}
                        </p>

                        <p className="text-xs text-muted-foreground/80 pt-1">
                          {formattedDate}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 ms-auto">
                      {(item.type === NotificationType.NEW_ORDER ||
                        item.type === NotificationType.NEW_PARTNERSHIP_APPLICATION ||
                        item.type === "NEW_ORDER" ||
                        item.type === "NEW_PARTNERSHIP_APPLICATION") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigate(item)}
                          className="h-8 gap-1 text-xs cursor-pointer"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>{isRtl ? "عرض" : "View"}</span>
                        </Button>
                      )}

                      {!item.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(item.id)}
                          className="h-8 gap-1 text-xs cursor-pointer"
                          title={t("markRead")}
                        >
                          <Check className="size-3.5 text-emerald-600" />
                          <span>{t("markRead")}</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                        title={t("delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <TablePagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.totalItems}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        className="pt-2"
      />
    </div>
  )
}
