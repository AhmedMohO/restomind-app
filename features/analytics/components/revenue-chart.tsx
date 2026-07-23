"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"
import type { RevenueTrendPoint } from "../types"

interface RevenueChartProps {
  data: RevenueTrendPoint[]
  period: "7d" | "30d"
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#10B981", // Emerald 500
  },
  orders: {
    label: "Orders",
    color: "#6366F1", // Indigo 500
  },
} satisfies ChartConfig

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0].payload as RevenueTrendPoint
  const dateObj = new Date(dataPoint.date)
  const formattedDate = isNaN(dateObj.getTime())
    ? dataPoint.date
    : dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

  return (
    <div className="min-w-[170px] space-y-2 rounded-xl border border-border/80 bg-background/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
      <p className="border-b border-border/60 pb-1.5 font-semibold text-foreground">
        {formattedDate}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Revenue</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {new Intl.NumberFormat("en-EG", {
              style: "currency",
              currency: "EGP",
              maximumFractionDigits: 0,
            }).format(dataPoint.revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-indigo-500" />
            <span>Orders</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {dataPoint.orders}
          </span>
        </div>
      </div>
    </div>
  )
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const t = useTranslations("Dashboard.analytics")
  const [activeMetric, setActiveMetric] = useState<"revenue" | "both">("both")

  const totalRevenue = data.reduce((acc, pt) => acc + pt.revenue, 0)
  const totalOrders = data.reduce((acc, pt) => acc + pt.orders, 0)
  const avgOrderValue =
    totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <Card className="h-full overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-xs">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">
              {t("chartRevenueTitle")}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {t("chartRevenueSubtitle", { period: period === "7d" ? 7 : 30 })}
          </CardDescription>
        </div>

        {/* Aggregate Pill Highlights */}
        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              {t("totalPeriodRevenue")}
            </p>
            <p className="text-base font-extrabold text-foreground">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 sm:block">
            <p className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
              Avg Order Value
            </p>
            <p className="text-base font-extrabold text-foreground">
              {formatCurrency(avgOrderValue)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {data.length === 0 ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {t("noRevenueData")}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  {/* Vibrant Gradient for Revenue */}
                  <linearGradient
                    id="emeraldRevenueGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="75%" stopColor="#10B981" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  {/* Indigo Gradient for Orders */}
                  <linearGradient
                    id="indigoOrdersGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="75%" stopColor="#6366F1" stopOpacity={0.03} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={11}
                  className="font-medium text-muted-foreground"
                  tickFormatter={(val) => {
                    const d = new Date(val)
                    return isNaN(d.getTime())
                      ? val
                      : `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />

                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  className="font-medium text-muted-foreground"
                  tickFormatter={(val) => `${val}`}
                />

                <ChartTooltip content={<CustomTooltip />} />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldRevenueGrad)"
                  activeDot={{
                    r: 6,
                    fill: "#10B981",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />

                {activeMetric === "both" && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366F1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#indigoOrdersGrad)"
                    activeDot={{
                      r: 5,
                      fill: "#6366F1",
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
