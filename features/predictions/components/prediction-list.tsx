"use client"

import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { TableState } from "@/components/ui/table-state"
import { useTableControls } from "@/hooks/use-table-controls"
import { usePredictionsList } from "@/features/predictions/hooks/use-predictions"
import { PredictionRow } from "./prediction-row"

export interface PredictionListProps {
  targetWeek: string
  /** Truthy while a batch recalculation is in flight — drives the 5s poll
   * so finished rows appear without a page refresh. See
   * predictions-dashboard.tsx for why this isn't derived in here. */
  refetchInterval: number | false
}

/**
 * The main product table (brief Step 4): one row per prediction, expandable
 * to the daily chart/table and the model's factor chips.
 */
export function PredictionList({
  targetWeek,
  refetchInterval,
}: PredictionListProps) {
  const t = useTranslations("predictions")
  const tCommon = useTranslations("Common")
  const { page, setPage, limit, setLimit } = useTableControls({
    initialLimit: 10,
  })

  const { data, isLoading, isError, refetch } = usePredictionsList(
    { targetWeek, page, limit },
    { refetchInterval }
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-4">
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={items.length === 0}
          onRetry={() => refetch()}
          errorText={t("fetchError")}
          retryText={t("retry")}
          emptyIcon={TrendingUp}
          emptyTitle={t("empty")}
          emptyDescription={t("emptyHint")}
        >
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-start">{t("product")}</TableHead>
                <TableHead className="text-end">
                  {t("predictedOrders")}
                </TableHead>
                <TableHead className="text-start">{t("confidence")}</TableHead>
                <TableHead className="text-start">{t("source")}</TableHead>
                <TableHead className="text-start">
                  {t("modelVersion")}
                </TableHead>
                <TableHead className="text-start">{t("lastUpdated")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((prediction) => (
                <PredictionRow key={prediction._id} prediction={prediction} />
              ))}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}
