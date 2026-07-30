"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { TriangleAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TablePagination } from "@/components/ui/table-pagination"
import { useTableControls } from "@/hooks/use-table-controls"
import { Link } from "@/i18n/routing"
import { formatQty } from "@/lib/charts/format"
import type { UnassignedShortfall } from "@/features/predictions/hooks/use-predictions"

export interface UnassignedShortfallsProps {
  shortfalls: UnassignedShortfall[]
}

/**
 * Ingredients the last batch run needed but couldn't place an order for
 * because no supplier is assigned to them — returned by the
 * batch-recalculate response and, until now, shown nowhere. Renders nothing
 * until a batch run has actually produced a (possibly empty) list, so the
 * page doesn't lead with an alert card before anyone has clicked
 * "Recalculate all".
 */
export function UnassignedShortfalls({ shortfalls }: UnassignedShortfallsProps) {
  const t = useTranslations("predictions")
  const locale = useLocale()
  const { page, setPage, limit, setLimit } = useTableControls({ initialLimit: 5 })

  if (shortfalls.length === 0) return null

  const total = shortfalls.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = shortfalls.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  )

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
          {t("shortfalls.title")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("shortfalls.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y divide-border">
          {paginatedItems.map((item) => (
            <li
              key={item.ingredientId}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.ingredientName}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono">
                    {item.ingredientCode}
                  </span>
                  <span className="mx-1.5">·</span>
                  {t("shortfalls.shortfall")}: {formatQty(item.shortfall, locale)}{" "}
                  {item.unit}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/purchase-orders/new" />}
              >
                {t("shortfalls.assignSupplier")}
              </Button>
            </li>
          ))}
        </ul>

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </CardContent>
    </Card>
  )
}

