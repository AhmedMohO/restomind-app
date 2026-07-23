"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslations } from "next-intl"
import { PieChart as PieChartIcon } from "lucide-react"
import { getStatusMeta } from "@/features/orders/status"
import type { OrdersByStatusSummary } from "../types"

interface OrdersStatusChartProps {
  ordersByStatus: OrdersByStatusSummary
}

const STATUS_COLOR_MAP: Record<string, string> = {
  Pending: "#F59E0B", // Amber 500
  Confirmed: "#10B981", // Emerald 500
  Preparing: "#3B82F6", // Blue 500
  Ready: "#22C55E", // Green 500
  "Out For Delivery": "#0EA5E9", // Sky 500
  Delivered: "#14B8A6", // Teal 500
  Cancelled: "#F43F5E", // Rose 500
}

export function OrdersStatusChart({ ordersByStatus }: OrdersStatusChartProps) {
  const t = useTranslations("Dashboard.analytics")
  const tOrders = useTranslations("Orders")

  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0)

  const chartData = [
    { name: "Pending", value: ordersByStatus.Pending, color: STATUS_COLOR_MAP.Pending },
    { name: "Confirmed", value: ordersByStatus.Confirmed, color: STATUS_COLOR_MAP.Confirmed },
    { name: "Preparing", value: ordersByStatus.Preparing, color: STATUS_COLOR_MAP.Preparing },
    { name: "Ready", value: ordersByStatus.Ready, color: STATUS_COLOR_MAP.Ready },
    { name: "Out For Delivery", value: ordersByStatus["Out For Delivery"], color: STATUS_COLOR_MAP["Out For Delivery"] },
    { name: "Delivered", value: ordersByStatus.Delivered, color: STATUS_COLOR_MAP.Delivered },
    { name: "Cancelled", value: ordersByStatus.Cancelled, color: STATUS_COLOR_MAP.Cancelled },
  ].filter((item) => item.value > 0)

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/95 shadow-xs h-full flex flex-col justify-between overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 px-6 py-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <PieChartIcon className="size-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">{t("chartOrdersStatusTitle")}</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("chartOrdersStatusSubtitle", { total: totalOrders })}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
        {totalOrders === 0 ? (
          <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">{t("noOrdersData")}</p>
          </div>
        ) : (
          <>
            {/* Donut Chart with Center Text */}
            <div className="relative h-[190px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const d = payload[0].payload
                      const pct = ((d.value / totalOrders) * 100).toFixed(1)
                      const meta = getStatusMeta(d.name)
                      return (
                        <div className="rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-xl backdrop-blur-md text-xs space-y-1">
                          <div className="flex items-center gap-2 font-semibold">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span>{tOrders(meta.labelKey)}</span>
                          </div>
                          <p className="text-muted-foreground font-mono">
                            {d.value} orders ({pct}%)
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay Stats */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold tracking-tight text-foreground">{totalOrders}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Structured Compact Status Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
              {Object.entries(ordersByStatus).map(([statusKey, count]) => {
                const meta = getStatusMeta(statusKey)
                const Icon = meta.Icon
                const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(0) : "0"
                const color = STATUS_COLOR_MAP[statusKey] || "#9CA3AF"

                return (
                  <div
                    key={statusKey}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 p-2 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-foreground truncate">{tOrders(meta.labelKey)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-bold text-foreground">{count}</span>
                      <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
