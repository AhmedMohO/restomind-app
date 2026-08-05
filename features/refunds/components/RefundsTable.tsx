"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  Receipt,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TablePagination } from "@/components/ui/table-pagination"
import { reviewRefundAction } from "../actions"
import {
  formatRefundAmount,
  needsAttention,
  type ApiRefund,
  type RefundStatus,
} from "../api/type"
import { formatDate, formatCurrency } from "@/lib/utils"

interface RefundsTableProps {
  refunds: ApiRefund[]
}

const STATUS_CONFIG: Record<
  RefundStatus,
  {
    icon: React.ElementType
    badgeClass: string
    dotClass: string
  }
> = {
  requested: {
    icon: Clock,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    dotClass: "bg-amber-500 animate-ping",
  },
  approved: {
    icon: CheckCircle2,
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    dotClass: "bg-blue-500",
  },
  processing: {
    icon: Loader2,
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20",
    dotClass: "bg-indigo-500 animate-spin",
  },
  succeeded: {
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    icon: XCircle,
    badgeClass:
      "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/20",
    dotClass: "bg-slate-500",
  },
  failed: {
    icon: AlertCircle,
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20",
    dotClass: "bg-rose-500",
  },
  manual_required: {
    icon: AlertTriangle,
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 hover:bg-rose-500/25 animate-pulse",
    dotClass: "bg-rose-600 animate-ping",
  },
}

export default function RefundsTable({ refunds }: RefundsTableProps) {
  const t = useTranslations("Dashboard.refunds")
  const locale = useLocale()

  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [settlementFilter, setSettlementFilter] = React.useState<string>("all")

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  // Dialog States
  const [rejectingRefund, setRejectingRefund] = React.useState<ApiRefund | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [approvingRefund, setApprovingRefund] = React.useState<ApiRefund | null>(null)
  const [detailsRefund, setDetailsRefund] = React.useState<ApiRefund | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [search, statusFilter, settlementFilter])

  // Compute Metrics
  const metrics = React.useMemo(() => {
    const totalCount = refunds.length
    const totalCents = refunds.reduce((acc, r) => acc + (r.amountCents || 0), 0)

    const awaitingCount = refunds.filter((r) => r.status === "requested").length
    const awaitingCents = refunds
      .filter((r) => r.status === "requested")
      .reduce((acc, r) => acc + (r.amountCents || 0), 0)

    const manualCount = refunds.filter(
      (r) => r.status === "manual_required" || r.status === "failed"
    ).length

    const succeededCount = refunds.filter((r) => r.status === "succeeded").length
    const succeededCents = refunds
      .filter((r) => r.status === "succeeded")
      .reduce((acc, r) => acc + (r.amountCents || 0), 0)

    return {
      totalCount,
      totalCents,
      awaitingCount,
      awaitingCents,
      manualCount,
      succeededCount,
      succeededCents,
    }
  }, [refunds])

  // Filter & Sort Refunds
  const filteredRefunds = React.useMemo(() => {
    return refunds
      .filter((refund) => {
        // Status filter
        if (statusFilter === "attention") {
          if (!needsAttention(refund.status)) return false
        } else if (statusFilter !== "all") {
          if (refund.status !== statusFilter) return false
        }

        // Settlement mode filter
        if (settlementFilter !== "all") {
          if (refund.settlementMode !== settlementFilter) return false
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase()
          const matchReason = refund.reason?.toLowerCase().includes(q)
          const matchId = refund._id.toLowerCase().includes(q)
          const matchGroup = refund.orderGroupId?.toLowerCase().includes(q)
          const matchPayment = refund.paymentId?.toLowerCase().includes(q)
          const matchError = refund.gatewayError?.toLowerCase().includes(q)
          if (
            !matchReason &&
            !matchId &&
            !matchGroup &&
            !matchPayment &&
            !matchError
          ) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // Prioritize requests needing attention first
        const aNeeds = needsAttention(a.status) ? 0 : 1
        const bNeeds = needsAttention(b.status) ? 0 : 1
        if (aNeeds !== bNeeds) return aNeeds - bNeeds
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [refunds, search, statusFilter, settlementFilter])

  // Pagination calculation
  const totalPages = Math.ceil(filteredRefunds.length / limit) || 1
  const paginatedRefunds = React.useMemo(() => {
    const start = (page - 1) * limit
    return filteredRefunds.slice(start, start + limit)
  }, [filteredRefunds, page, limit])

  const isFiltered = Boolean(search || statusFilter !== "all" || settlementFilter !== "all")

  function handleReview(
    refund: ApiRefund,
    decision: "approve" | "reject",
    reason?: string
  ) {
    setPendingId(refund._id)
    startTransition(async () => {
      const result = await reviewRefundAction(refund._id, decision, reason)
      setPendingId(null)
      setRejectingRefund(null)
      setApprovingRefund(null)
      setRejectionReason("")
      if (detailsRefund?._id === refund._id) {
        setDetailsRefund(null)
      }
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  function handleCopy(text: string, idKey: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(idKey)
    toast.success(t("details.copied"))
    setTimeout(() => setCopiedId(null), 2000)
  }

  const quickRejectionReasons = [
    t("actions.quickReasons.reason1"),
    t("actions.quickReasons.reason2"),
    t("actions.quickReasons.reason3"),
    t("actions.quickReasons.reason4"),
  ]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
              <RotateCcw className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t("title")}
                </h1>
                {metrics.awaitingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400"
                  >
                    <span className="me-1.5 size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                    {t("badgePending", { count: metrics.awaitingCount })}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2 rounded-xl border-border hover:bg-accent hover:text-foreground"
          >
            <RefreshCcw className="size-4 text-muted-foreground" />
            <span>{t("filters.clearFilters")}</span>
          </Button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Refunds */}
        <Card className="relative overflow-hidden border bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("metrics.totalRefunds")}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {metrics.totalCount}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  ({formatCurrency(metrics.totalCents / 100, locale)})
                </span>
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-primary/40 to-primary/10" />
        </Card>

        {/* Awaiting Review */}
        <Card className="relative overflow-hidden border bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("metrics.awaitingReview")}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {metrics.awaitingCount}
                </span>
                {metrics.awaitingCents > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    ({formatCurrency(metrics.awaitingCents / 100, locale)})
                  </span>
                )}
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
        </Card>

        {/* Needs Manual Payout */}
        <Card className="relative overflow-hidden border bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("metrics.needsManual")}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {metrics.manualCount}
                </span>
                {metrics.manualCount > 0 && (
                  <span className="inline-flex items-center rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    {t("metrics.manualNotice")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="size-5" />
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-rose-600 to-rose-400" />
        </Card>

        {/* Total Value Refunded */}
        <Card className="relative overflow-hidden border bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t("metrics.totalAmount")}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(metrics.succeededCents / 100, locale)}
                </span>
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />
        </Card>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 pe-9 h-9 text-xs rounded-xl bg-background"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs bg-background">
              <div className="flex items-center gap-2 truncate">
                <Filter className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder={t("filters.statusAll")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.statusAll")}</SelectItem>
              <SelectItem value="attention">{t("filters.statusAttention")}</SelectItem>
              <SelectItem value="requested">{t("filters.statusRequested")}</SelectItem>
              <SelectItem value="approved">{t("filters.statusApproved")}</SelectItem>
              <SelectItem value="processing">{t("filters.statusProcessing")}</SelectItem>
              <SelectItem value="succeeded">{t("filters.statusSucceeded")}</SelectItem>
              <SelectItem value="manual_required">{t("filters.statusManualRequired")}</SelectItem>
              <SelectItem value="rejected">{t("filters.statusRejected")}</SelectItem>
              <SelectItem value="failed">{t("filters.statusFailed")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Settlement Filter */}
          <Select value={settlementFilter} onValueChange={(val) => val && setSettlementFilter(val)}>
            <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs bg-background">
              <SelectValue placeholder={t("filters.settlementAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.settlementAll")}</SelectItem>
              <SelectItem value="gateway">{t("filters.settlementGateway")}</SelectItem>
              <SelectItem value="offline">{t("filters.settlementOffline")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
                setSettlementFilter("all")
              }}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              <span>{t("filters.clearFilters")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Refunds Table */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {filteredRefunds.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground ring-8 ring-muted/20">
              <RotateCcw className="size-8" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {isFiltered ? t("empty.noMatch") : t("empty.title")}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {isFiltered ? t("empty.noMatch") : t("empty.description")}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                  setSettlementFilter("all")
                }}
                className="mt-4 gap-2 rounded-xl text-xs"
              >
                <X className="size-3.5" />
                {t("empty.resetFilters")}
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[180px] font-semibold text-xs">{t("table.status")}</TableHead>
                <TableHead className="font-semibold text-xs">{t("table.amount")}</TableHead>
                <TableHead className="font-semibold text-xs">{t("table.scope")}</TableHead>
                <TableHead className="max-w-[260px] font-semibold text-xs">{t("table.reason")}</TableHead>
                <TableHead className="font-semibold text-xs">{t("table.date")}</TableHead>
                <TableHead className="text-end font-semibold text-xs">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedRefunds.map((refund) => {
                const config = STATUS_CONFIG[refund.status] || STATUS_CONFIG.requested
                const IconComponent = config.icon
                const busy = isPending && pendingId === refund._id

                return (
                  <TableRow
                    key={refund._id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setDetailsRefund(refund)}
                  >
                    {/* Status Cell */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 py-1 px-2.5 font-semibold text-xs border rounded-xl ${config.badgeClass}`}
                        >
                          <IconComponent className={`size-3.5 shrink-0 ${refund.status === "processing" ? "animate-spin" : ""}`} />
                          <span>{t(`statusLabels.${refund.status}` as any)}</span>
                        </Badge>

                        {/* Settlement tag */}
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground ps-0.5">
                          {refund.settlementMode === "offline" ? (
                            <>
                              <Banknote className="size-3 text-amber-600 dark:text-amber-400" />
                              <span>{t("table.offlineCash")}</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="size-3 text-blue-600 dark:text-blue-400" />
                              <span>{t("table.onlineGateway")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Amount Cell */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-base tabular-nums text-foreground">
                          {formatCurrency(refund.amountCents / 100, locale)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ID: #{refund._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Scope Cell */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="rounded-lg bg-secondary/60 text-[11px] font-medium text-secondary-foreground"
                      >
                        {refund.lineItemIndexes?.length
                          ? t("table.itemsCount", { count: refund.lineItemIndexes.length })
                          : refund.orderId
                          ? t("table.singleResto")
                          : t("table.wholeOrder")}
                      </Badge>
                    </TableCell>

                    {/* Reason & Error Cell */}
                    <TableCell className="max-w-[260px]">
                      <div className="flex flex-col text-xs">
                        <p className="line-clamp-2 font-medium text-foreground/90">
                          {refund.reason || "—"}
                        </p>
                        {refund.gatewayError && (
                          <div className="mt-1 flex items-start gap-1 rounded-lg bg-rose-500/10 p-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <AlertTriangle className="mt-0.5 size-3 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span className="line-clamp-2">{refund.gatewayError}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Date Cell */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(refund.createdAt, locale)}
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {refund.status === "requested" ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => setApprovingRefund(refund)}
                              className="h-8 gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-xs px-2.5 font-medium"
                            >
                              {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              <span>{t("actions.approve")}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setRejectingRefund(refund)
                                setRejectionReason("")
                              }}
                              className="h-8 gap-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 border-rose-500/30 px-2.5 font-medium"
                            >
                              <X className="size-3.5" />
                              <span>{t("actions.reject")}</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailsRefund(refund)}
                            className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="size-3.5" />
                            <span>{t("table.viewDetails")}</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Table Pagination */}
      {filteredRefunds.length > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={filteredRefunds.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }}
        />
      )}

      {/* Details Dialog */}
      <Dialog open={Boolean(detailsRefund)} onOpenChange={(open) => !open && setDetailsRefund(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-bold">
                {t("details.title")}
              </DialogTitle>
              {detailsRefund && (
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${STATUS_CONFIG[detailsRefund.status]?.badgeClass}`}
                >
                  {t(`statusLabels.${detailsRefund.status}` as any)}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("details.subtitle")}
            </DialogDescription>
          </DialogHeader>

          {detailsRefund && (
            <div className="space-y-4 py-2 text-xs">
              {/* Amount Banner */}
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3.5 border">
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("table.amount")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(detailsRefund.amountCents / 100, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 border text-xs font-medium">
                  {detailsRefund.settlementMode === "offline" ? (
                    <>
                      <Banknote className="size-4 text-amber-500" />
                      <span>{t("table.offlineCash")}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4 text-blue-500" />
                      <span>{t("table.onlineGateway")}</span>
                    </>
                  )}
                </div>
              </div>

              {/* IDs Grid */}
              <div className="space-y-2 rounded-xl border bg-card p-3">
                {/* Refund ID */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("details.refundId")}:</span>
                  <div className="flex items-center gap-1 font-mono font-medium text-foreground">
                    <span>{detailsRefund._id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(detailsRefund._id, "refundId")}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Order Group ID */}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">{t("details.orderGroupId")}:</span>
                  <div className="flex items-center gap-1 font-mono font-medium text-foreground">
                    <span>{detailsRefund.orderGroupId}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(detailsRefund.orderGroupId, "groupId")}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Payment Transaction ID */}
                {detailsRefund.paymentId && (
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground">{t("details.paymentId")}:</span>
                    <div className="flex items-center gap-1 font-mono font-medium text-foreground">
                      <span>{detailsRefund.paymentId}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(detailsRefund.paymentId!, "paymentId")}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <span className="font-semibold text-foreground">{t("table.reason")}</span>
                <p className="rounded-xl border bg-muted/30 p-3 text-foreground/90">
                  {detailsRefund.reason || "—"}
                </p>
              </div>

              {/* Gateway Error Box */}
              {detailsRefund.gatewayError && (
                <div className="space-y-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {t("details.gatewayError")}
                  </span>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                    {detailsRefund.gatewayError}
                  </div>
                </div>
              )}

              {/* Rejection Reason Box */}
              {detailsRefund.rejectionReason && (
                <div className="space-y-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {t("details.rejectionReason")}
                  </span>
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-rose-700 dark:text-rose-300">
                    {detailsRefund.rejectionReason}
                  </p>
                </div>
              )}

              {/* Metadata Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground border-t pt-3">
                <div>
                  <span className="block font-medium text-foreground">{t("table.date")}</span>
                  {formatDate(detailsRefund.createdAt, locale)}
                </div>
                {detailsRefund.completedAt && (
                  <div>
                    <span className="block font-medium text-foreground">{t("details.completedAt")}</span>
                    {formatDate(detailsRefund.completedAt, locale)}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {detailsRefund?.status === "requested" && (
              <>
                <Button
                  size="sm"
                  onClick={() => {
                    setApprovingRefund(detailsRefund)
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl"
                >
                  <Check className="size-4 me-1.5" />
                  {t("actions.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectingRefund(detailsRefund)
                    setRejectionReason("")
                  }}
                  className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 rounded-xl"
                >
                  <X className="size-4 me-1.5" />
                  {t("actions.reject")}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setDetailsRefund(null)} className="rounded-xl">
              {t("details.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={Boolean(rejectingRefund)}
        onOpenChange={(open) => !open && setRejectingRefund(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400">
              {t("actions.rejectTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("actions.rejectDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            {/* Quick Reasons Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">
                {t("actions.quickReasonsTitle")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickRejectionReasons.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(chip)}
                    className="rounded-lg border bg-muted/50 px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-start"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("actions.rejectionPlaceholder")}
              rows={3}
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingRefund(null)}
              className="rounded-xl"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!rejectionReason.trim() || isPending}
              onClick={() =>
                rejectingRefund &&
                handleReview(rejectingRefund, "reject", rejectionReason.trim())
              }
              className="rounded-xl gap-2"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t("actions.confirmReject")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={Boolean(approvingRefund)}
        onOpenChange={(open) => !open && setApprovingRefund(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {t("actions.approveTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("actions.approveDesc")}
            </DialogDescription>
          </DialogHeader>

          {approvingRefund && (
            <div className="rounded-xl border bg-muted/40 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("table.amount")}:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(approvingRefund.amountCents / 100, locale)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("details.settlementMethod")}:</span>
                <span className="font-semibold capitalize text-foreground">
                  {approvingRefund.settlementMode === "offline"
                    ? t("table.offlineCash")
                    : t("table.onlineGateway")}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovingRefund(null)}
              className="rounded-xl"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => approvingRefund && handleReview(approvingRefund, "approve")}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl gap-2 font-medium"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t("actions.confirmApprove")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
