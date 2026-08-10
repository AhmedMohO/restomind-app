"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { notificationSocketService } from "@/features/notifications/services/socket-service"
import type { NotificationItem } from "@/features/notifications/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bell, ShoppingBag, FileText, X, ExternalLink } from "lucide-react"

interface NotificationSocketContextValue {
  lastNotification: NotificationItem | null
}

const NotificationSocketContext = createContext<NotificationSocketContextValue>({
  lastNotification: null,
})

export const useNotificationSocket = () => useContext(NotificationSocketContext)

function NotificationToastCard({
  notification,
  onDismiss,
}: {
  notification: NotificationItem
  onDismiss: () => void
}) {
  const getIconAndStyle = () => {
    switch (notification.type) {
      case "NEW_ORDER":
        return {
          icon: ShoppingBag,
          bgColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          badgeLabel: "Order",
        }
      case "NEW_PARTNERSHIP_APPLICATION":
        return {
          icon: FileText,
          bgColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
          badgeLabel: "Partnership",
        }
      default:
        return {
          icon: Bell,
          bgColor: "bg-primary/15 text-primary border-primary/20",
          badgeLabel: "Alert",
        }
    }
  }

  const { icon: Icon, bgColor, badgeLabel } = getIconAndStyle()

  const handleNavigate = () => {
    onDismiss()
    if (notification.type === "NEW_ORDER") {
      window.location.href = "/dashboard/orders"
    } else if (notification.type === "NEW_PARTNERSHIP_APPLICATION") {
      window.location.href = "/dashboard/partnership-applications"
    } else {
      window.location.href = "/dashboard/notifications"
    }
  }

  return (
    <div className="w-full max-w-md bg-card/95 backdrop-blur-md text-card-foreground border border-border/80 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in fade-in-0 slide-in-from-top-3">
      <div className="flex items-start gap-3.5">
        <div className={cn("p-2.5 rounded-xl border shrink-0 mt-0.5", bgColor)}>
          <Icon className="size-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-foreground truncate">
              {notification.title}
            </h4>
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider shrink-0 px-2 py-0.5">
              {badgeLabel}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {notification.message}
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 text-xs px-2.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleNavigate}
              className="h-7 text-xs px-3 rounded-lg gap-1 font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <span>View</span>
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const pathname = usePathname()
  const [lastNotification, setLastNotification] = useState<NotificationItem | null>(null)

  const isDashboard = pathname?.includes("/dashboard") ?? false

  useEffect(() => {
    // Connect only when user is authenticated, store is hydrated, and on a dashboard page
    if (isHydrated && user && isDashboard) {
      notificationSocketService.connect()

      const unsubscribe = notificationSocketService.subscribe((notification) => {
        setLastNotification(notification)

        // Display rich Shadcn UI custom Toast alert via Sonner
        toast.custom(
          (t) => (
            <NotificationToastCard
              notification={notification}
              onDismiss={() => toast.dismiss(t)}
            />
          ),
          { duration: 7000 }
        )
      })

      return () => {
        unsubscribe()
      }
    } else if (isHydrated && (!user || !isDashboard)) {
      notificationSocketService.disconnect()
    }
  }, [user, isHydrated, isDashboard])

  return (
    <NotificationSocketContext.Provider value={{ lastNotification }}>
      {children}
    </NotificationSocketContext.Provider>
  )
}
