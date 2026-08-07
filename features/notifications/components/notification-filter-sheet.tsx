"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { NotificationQuery } from "../types"

const ALL = "ALL"

export const DEFAULT_NOTIFICATION_FILTERS: NotificationQuery = {
  isRead: undefined,
  type: undefined,
  createdAfter: undefined,
  createdBefore: undefined,
  sortBy: "createdAt",
  order: "desc",
}

export function countActiveNotificationFilters(filters: NotificationQuery): number {
  let count = 0
  if (filters.isRead !== undefined) count++
  if (filters.type && filters.type !== ALL) count++
  if (filters.createdAfter) count++
  if (filters.createdBefore) count++
  if (filters.sortBy && filters.sortBy !== "createdAt") count++
  if (filters.order && filters.order !== "desc") count++
  return count
}

interface NotificationFilterSheetProps {
  filters: NotificationQuery
  onChange: <K extends keyof NotificationQuery>(
    key: K,
    value: NotificationQuery[K]
  ) => void
  onReset: () => void
}

function FilterSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs ${className ?? ""}`}
    >
      {children}
    </div>
  )
}

export function NotificationFilterSheet({
  filters,
  onChange,
  onReset,
}: NotificationFilterSheetProps) {
  const locale = useLocale()
  const isRtl = locale === "ar"
  const activeCount = countActiveNotificationFilters(filters)

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl text-xs font-medium cursor-pointer">
            <SlidersHorizontal className="size-3.5" />
            <span>{isRtl ? "تصفية متقدمة" : "Advanced Filters"}</span>
            {activeCount > 0 && (
              <Badge className="flex size-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border bg-card/60 p-5 text-start backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Filter className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold tracking-tight">
                {isRtl ? "تصفية الإشعارات" : "Filter Notifications"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {isRtl
                  ? "تحديد معايير تصفية وتاريخ الإشعارات من السيرفر"
                  : "Refine notification list using backend query parameters"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Read Status */}
          <FilterSection>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="notif-read-status" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  <span>{isRtl ? "حالة القراءة" : "Read Status"}</span>
                </Label>
                {filters.isRead !== undefined && (
                  <button
                    type="button"
                    onClick={() => onChange("isRead", undefined)}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    {isRtl ? "إعادة ضبط" : "Reset"}
                  </button>
                )}
              </div>
              <Select
                value={
                  filters.isRead === undefined
                    ? ALL
                    : filters.isRead
                    ? "true"
                    : "false"
                }
                onValueChange={(val) =>
                  onChange(
                    "isRead",
                    !val || val === ALL ? undefined : val === "true"
                  )
                }
              >
                <SelectTrigger id="notif-read-status" className="h-9 w-full rounded-xl text-xs">
                  <SelectValue placeholder={isRtl ? "الجميع" : "All Statuses"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>
                    {isRtl ? "جميع الإشعارات (المقروءة والجديدة)" : "All Notifications"}
                  </SelectItem>
                  <SelectItem value="false">
                    {isRtl ? "غير مقروءة فقط" : "Unread Only"}
                  </SelectItem>
                  <SelectItem value="true">
                    {isRtl ? "مقروءة فقط" : "Read Only"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterSection>

          {/* Date Range Section */}
          <FilterSection>
            <Label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CalendarIcon className="size-3.5 text-primary" />
              <span>{isRtl ? "النطاق الزمني للإشعار" : "Creation Date Range"}</span>
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="notif-start-date" className="text-[11px] font-medium text-muted-foreground">
                  {isRtl ? "من تاريخ" : "From Date (createdAfter)"}
                </Label>
                <DatePicker
                  value={filters.createdAfter}
                  onChange={(val) => onChange("createdAfter", val ? `${val}T00:00:00.000Z` : undefined)}
                  placeholder={isRtl ? "اختر التاريخ" : "Select date"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notif-end-date" className="text-[11px] font-medium text-muted-foreground">
                  {isRtl ? "إلى تاريخ" : "To Date (createdBefore)"}
                </Label>
                <DatePicker
                  value={filters.createdBefore}
                  onChange={(val) => onChange("createdBefore", val ? `${val}T23:59:59.999Z` : undefined)}
                  placeholder={isRtl ? "اختر التاريخ" : "Select date"}
                />
              </div>
            </div>
          </FilterSection>

          {/* Sorting Options */}
          <FilterSection>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Sort By Field */}
              <div className="space-y-1.5">
                <Label htmlFor="notif-sort-by" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-primary" />
                  <span>{isRtl ? "ترتيب بحسب" : "Sort By"}</span>
                </Label>
                <Select
                  value={filters.sortBy || "createdAt"}
                  onValueChange={(val) =>
                    onChange("sortBy", (val === "readAt" ? "readAt" : "createdAt") as "createdAt" | "readAt")
                  }
                >
                  <SelectTrigger id="notif-sort-by" className="h-9 w-full rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">
                      {isRtl ? "تاريخ الإرسال (createdAt)" : "Creation Date"}
                    </SelectItem>
                    <SelectItem value="readAt">
                      {isRtl ? "تاريخ القراءة (readAt)" : "Read Date"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="notif-sort-order" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ArrowUpDown className="size-3.5 text-primary" />
                  <span>{isRtl ? "الاتجاه" : "Order"}</span>
                </Label>
                <Select
                  value={filters.order || "desc"}
                  onValueChange={(val) =>
                    onChange("order", (val === "asc" ? "asc" : "desc") as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="notif-sort-order" className="h-9 w-full rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">
                      {isRtl ? "الأحدث أولاً (Desc)" : "Newest First"}
                    </SelectItem>
                    <SelectItem value="asc">
                      {isRtl ? "الأقدم أولاً (Asc)" : "Oldest First"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FilterSection>
        </div>

        <SheetFooter className="border-t border-border bg-card/60 p-4 backdrop-blur-xs">
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full gap-2 rounded-xl text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>{isRtl ? "إعادة ضبط الفلاتر" : "Reset All Filters"}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
