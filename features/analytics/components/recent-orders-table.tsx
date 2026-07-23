"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link } from "@/i18n/routing"
import { ArrowRight, ShoppingBag, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { getStatusMeta } from "@/features/orders/status"
import type { DashboardRecentOrder } from "../types"

interface RecentOrdersTableProps {
  orders: DashboardRecentOrder[]
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const t = useTranslations("Dashboard.analytics")
  const tOrders = useTranslations("Orders")
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null)

  useEffect(() => {
    setNowTimestamp(Date.now())
  }, [])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-EG", { style: "currency", currency: "EGP" }).format(val)

  const getInitials = (name: string) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }

  const formatTimeAgo = (isoString: string) => {
    if (!nowTimestamp) {
      const d = new Date(isoString)
      return isNaN(d.getTime()) ? isoString : `${d.getMonth() + 1}/${d.getDate()}`
    }

    const diffMs = nowTimestamp - new Date(isoString).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return t("justNow")
    if (diffMins < 60) return t("minsAgo", { count: diffMins })
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return t("hoursAgo", { count: diffHours })
    const diffDays = Math.floor(diffHours / 24)
    return t("daysAgo", { count: diffDays })
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/95 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">{t("recentOrdersTitle")}</CardTitle>
          </div>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/orders" />}
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <span>{t("viewAllOrders")}</span>
          <ArrowRight className="ms-1.5 size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-2xl bg-muted p-4 text-muted-foreground mb-3">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-sm font-bold text-foreground">{t("noRecentOrdersTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t("noRecentOrdersDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs rtl:text-right">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-6 font-semibold">{t("colOrderId")}</th>
                  <th className="py-3 px-4 font-semibold">{t("colCustomer")}</th>
                  <th className="py-3 px-4 font-semibold">{t("colRestaurant")}</th>
                  <th className="py-3 px-4 font-semibold">{t("colTotal")}</th>
                  <th className="py-3 px-4 font-semibold">{t("colStatus")}</th>
                  <th className="py-3 px-6 text-end font-semibold">{t("colTime")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((order) => {
                  const meta = getStatusMeta(order.overallStatus)
                  const Icon = meta.Icon
                  const shortId = `#${order.orderGroupId.slice(-6)}`

                  return (
                    <tr key={order.orderGroupId} className="group transition-colors hover:bg-muted/40">
                      <td className="py-3.5 px-6 font-mono font-bold text-primary">{shortId}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border/60">
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {getInitials(order.customerName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{order.customerName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {order.restaurantNames.join(", ")}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {formatCurrency(order.finalTotalPrice)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={`border-0 ${meta.badgeClass} px-2.5 py-0.5 text-[11px] font-semibold`}>
                          <Icon className="me-1 size-3" />
                          <span>{tOrders(meta.labelKey)}</span>
                        </Badge>
                      </td>

                      <td className="py-3.5 px-6 text-end text-muted-foreground font-medium">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground/70" />
                          <span>{formatTimeAgo(order.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
