"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TablePagination } from "@/components/ui/table-pagination"
import { useTableControls } from "@/hooks/use-table-controls"
import {
  useApproveRecommendation,
  useDismissRecommendation,
  useRecommendationsList,
} from "@/features/recommendations/hooks/use-recommendations"
import type {
  Recommendation,
  RecommendationStatus,
} from "@/features/recommendations/api/type"
import { RecommendationCard } from "./recommendation-card"
import { ApproveDialog } from "./approve-dialog"

const ALL_STATUSES = "all"
const FILTERABLE_STATUSES: RecommendationStatus[] = [
  "pending",
  "edited",
  "approved",
  "dismissed",
]

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function RecommendationList() {
  const t = useTranslations("recommendations")
  const [status, setStatus] = React.useState<RecommendationStatus | "all">("all")
  const [editing, setEditing] = React.useState<Recommendation | null>(null)
  const { page, setPage, limit, setLimit, resetPage } = useTableControls({
    initialLimit: 9,
  })

  const { data, isLoading } = useRecommendationsList({
    status: status === ALL_STATUSES ? undefined : status,
    page,
    limit,
  })
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Passed into the hooks (rather than as onSuccess/onError to mutate())
  // so the toasts live at mutation level — see the comment in
  // use-recommendations.ts on why per-call callbacks get dropped when a
  // second mutate() supersedes the first on the same observer.
  const approveMutation = useApproveRecommendation({
    success: t("approveSuccess"),
    conflict: t("approveError.conflict"),
    invalid: t("approveError.invalid"),
    notFound: t("approveError.notFound"),
    generic: t("approveError.generic"),
  })
  const dismissMutation = useDismissRecommendation({
    success: t("dismissSuccess"),
    error: t("dismissError"),
  })

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, input: {} })
  }

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="recommendation-status-filter" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {t("statusFilter")}:
          </Label>
          <Select
            value={status}
            onValueChange={(v) => {
              if (v) {
                setStatus(v as RecommendationStatus | "all")
                resetPage()
              }
            }}
          >
            <SelectTrigger id="recommendation-status-filter" aria-label={t("statusFilter")} className="w-40">
              <SelectValue placeholder={t("statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>{t("statusFilter")}</SelectItem>
              {FILTERABLE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Sparkles className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-heading text-sm font-medium">{t("empty")}</p>
          <p className="text-xs text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((recommendation) => (
            <RecommendationCard
              key={recommendation._id}
              recommendation={recommendation}
              onApprove={handleApprove}
              onEdit={setEditing}
              onDismiss={handleDismiss}
              isApproving={
                approveMutation.isPending &&
                approveMutation.variables?.id === recommendation._id
              }
              isDismissing={
                dismissMutation.isPending &&
                dismissMutation.variables === recommendation._id
              }
            />
          ))}
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <ApproveDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        recommendation={editing}
      />
    </div>
  )
}
