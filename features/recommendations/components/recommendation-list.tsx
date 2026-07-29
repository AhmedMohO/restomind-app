"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/utils"
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

  const { data, isLoading } = useRecommendationsList({
    status: status === ALL_STATUSES ? undefined : status,
    limit: 50,
  })
  const items = data?.items ?? []

  const approveMutation = useApproveRecommendation()
  const dismissMutation = useDismissRecommendation()

  const handleApprove = (id: string) => {
    approveMutation.mutate(
      { id, input: {} },
      {
        onSuccess: () => toast.success(t("approveSuccess")),
        // The mutation's own onError already surfaces 409/400/404 distinctly.
      }
    )
  }

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id, {
      onSuccess: () => toast.success(t("dismissSuccess")),
      onError: (err) => toast.error(getErrorMessage(err, t("dismissError"))),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select
          value={status}
          onValueChange={(v) => v && setStatus(v as RecommendationStatus | "all")}
        >
          <SelectTrigger className="w-40">
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

      <ApproveDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        recommendation={editing}
      />
    </div>
  )
}
