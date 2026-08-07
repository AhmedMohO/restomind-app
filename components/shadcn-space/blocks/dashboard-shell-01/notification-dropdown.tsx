"use client"

import { ReactNode, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  Trash2,
  ShoppingBag,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useNotifications } from "@/features/notifications/hooks/useNotifications"
import { NotificationType, type NotificationItem } from "@/features/notifications/types"

type Props = {
  trigger?: ReactNode
  defaultOpen?: boolean
  align?: "start" | "center" | "end"
}

function getNotificationIcon(type: string) {
  switch (type) {
    case NotificationType.NEW_ORDER:
    case "NEW_ORDER":
      return {
        icon: ShoppingBag,
        bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
        textColor: "text-emerald-600 dark:text-emerald-400",
      }
    case NotificationType.NEW_PARTNERSHIP_APPLICATION:
    case "NEW_PARTNERSHIP_APPLICATION":
      return {
        icon: FileText,
        bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
        textColor: "text-amber-600 dark:text-amber-400",
      }
    default:
      return {
        icon: Bell,
        bgColor: "bg-primary/10",
        textColor: "text-primary",
      }
  }
}

function formatRelativeTime(dateString: string, isRtl: boolean): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return isRtl ? "الآن" : "Just now"
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60)
      return isRtl ? `منذ ${mins} د` : `${mins}m ago`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return isRtl ? `منذ ${hours} س` : `${hours}h ago`
    }
    const days = Math.floor(diffInSeconds / 86400)
    return isRtl ? `منذ ${days} يوم` : `${days}d ago`
  } catch {
    return ""
  }
}

export function NotificationDropdown({
  trigger,
  defaultOpen,
  align = "end",
}: Props) {
  const locale = useLocale()
  const isRtl = locale === "ar"
  const router = useRouter()
  const t = useTranslations("Dashboard.notifications")
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    initialQuery: { limit: 10, isRead: filter === "unread" ? false : undefined },
  })

  const handleFilterChange = (newFilter: "all" | "unread") => {
    setFilter(newFilter)
    fetchNotifications({
      page: 1,
      isRead: newFilter === "unread" ? false : undefined,
    })
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id)
    }

    if (
      item.type === NotificationType.NEW_ORDER ||
      item.type === "NEW_ORDER"
    ) {
      router.push(`/${locale}/dashboard/orders`)
    } else if (
      item.type === NotificationType.NEW_PARTNERSHIP_APPLICATION ||
      item.type === "NEW_PARTNERSHIP_APPLICATION"
    ) {
      router.push(`/${locale}/dashboard/partnership-applications`)
    }
  }

  const defaultTrigger = (
    <div className="relative cursor-pointer rounded-full p-2 hover:bg-accent transition-colors">
      <BellRing className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 end-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  )

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu defaultOpen={defaultOpen}>
        <DropdownMenuTrigger>
          {trigger ? (
            <div className="relative cursor-pointer">
              {trigger}
              {unreadCount > 0 && (
                <span className="absolute top-0 end-0 flex size-2.5 rounded-full bg-destructive ring-2 ring-background" />
              )}
            </div>
          ) : (
            defaultTrigger
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className="p-0 w-80 sm:w-96 rounded-2xl shadow-xl data-open:slide-in-from-top-20 data-closed:slide-out-to-top-20 data-open:fade-in-0 data-closed:fade-out-0 duration-200"
        >
          {/* Header */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-popover-foreground">
                  {t("title")}
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="rounded-full px-2 text-xs">
                    {t("newBadge", { count: unreadCount })}
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <CheckCheck className="me-1 size-3.5" />
                  {t("markAllAsRead")}
                </Button>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-border/60 px-4 pb-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer",
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {t("filterAll")}
            </button>
            <button
              onClick={() => handleFilterChange("unread")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer",
                filter === "unread"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {t("filterUnread")} ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[320px] max-h-[350px]">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-2">
                  <AlertCircle className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("empty")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("emptyDesc")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {notifications.map((item) => {
                  const { icon: Icon, bgColor, textColor } = getNotificationIcon(item.type)
                  const relativeTime = formatRelativeTime(item.createdAt, isRtl)

                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "group flex items-start gap-3 p-3 transition-colors cursor-pointer text-start focus:bg-accent/80 border-s-2 border-transparent",
                        !item.isRead && "bg-accent/30 font-medium border-s-primary"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", bgColor, textColor)}>
                        <Icon className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate text-popover-foreground">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                            {relativeTime}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                          {item.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity self-center ms-1">
                        {!item.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full hover:bg-emerald-500/20 hover:text-emerald-600 text-muted-foreground cursor-pointer"
                            title={t("markRead")}
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(item.id)
                            }}
                          >
                            <Check className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-full hover:bg-destructive/20 hover:text-destructive text-muted-foreground cursor-pointer"
                          title={t("delete")}
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(item.id)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <DropdownMenuSeparator />

          {/* Footer View All Link */}
          <div className="p-2">
            <Link
              href={`/${locale}/dashboard/notifications`}
              className="flex w-full items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-9 text-xs font-medium transition-colors"
            >
              {t("viewAll")}
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default NotificationDropdown
