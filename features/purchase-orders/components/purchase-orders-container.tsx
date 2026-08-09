"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import {
  Clock,
  Eye,
  Filter,
  Loader2,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
  Search,
  Truck,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginatedSupplierSelect } from "@/features/suppliers/components/paginated-supplier-select"
import { Link, useRouter } from "@/i18n/routing"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"
import type {
  ApiPurchaseOrder,
  GetPurchaseOrdersParams,
  PurchaseOrderStatus,
} from "../types"
import {
  usePurchaseOrdersList,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from "../hooks/use-purchase-orders"
import { calculateOrderTotal, getStatusConfig, getSupplierName } from "../utils"

export function PurchaseOrdersContainer() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Dashboard.purchaseOrders")
  const isStaff = useAuthStore((s) => s.user?.role === "staff")

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [status, setStatus] = React.useState<PurchaseOrderStatus | "">("")
  const [supplierId, setSupplierId] = React.useState("")
  const [search, setSearch] = React.useState("")

  const [receiveTarget, setReceiveTarget] =
    React.useState<ApiPurchaseOrder | null>(null)
  const [cancelTarget, setCancelTarget] =
    React.useState<ApiPurchaseOrder | null>(null)

  const queryParams: GetPurchaseOrdersParams = {
    page,
    limit,
    status: status || undefined,
    supplierId: supplierId || undefined,
  }

  const { data, isLoading, isError, refetch } =
    usePurchaseOrdersList(queryParams)
  const receiveMutation = useReceivePurchaseOrder()
  const statusMutation = useUpdatePurchaseOrderStatus()

  // Client-side search filter by PO ID or supplier name if search text entered
  const orders = React.useMemo(() => {
    const allOrders = data?.items ?? []
    if (!search.trim()) return allOrders
    const query = search.toLowerCase().trim()
    return allOrders.filter((po: ApiPurchaseOrder) => {
      const idMatch = po._id.toLowerCase().includes(query)
      const supplierName = getSupplierName(po.supplierId).toLowerCase()
      return idMatch || supplierName.includes(query)
    })
  }, [data, search])

  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const activeFilterCount = [status, supplierId].filter(Boolean).length
  const isFiltered = activeFilterCount > 0 || Boolean(search)

  const resetFilters = () => {
    setStatus("")
    setSupplierId("")
    setSearch("")
    setPage(1)
  }

  const handleRowClick = (poId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("[role='menuitem']")
    ) {
      return
    }
    router.push(`/dashboard/purchase-orders/${poId}`)
  }

  const handleConfirmReceive = async () => {
    if (!receiveTarget) return
    try {
      await receiveMutation.mutateAsync(receiveTarget._id)
      toast.success(t("receiveSuccess"))
      setReceiveTarget(null)
    } catch (err) {
      console.error("[PurchaseOrdersContainer] receive failed", err)
      toast.error(getErrorMessage(err, t("receiveError")))
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      await statusMutation.mutateAsync({
        id: cancelTarget._id,
        status: "cancelled",
      })
      toast.success(t("statusUpdateSuccess"))
      setCancelTarget(null)
    } catch (err) {
      console.error("[PurchaseOrdersContainer] cancel failed", err)
      toast.error(getErrorMessage(err, t("statusUpdateError")))
    }
  }

  const handleStatusUpdate = async (
    id: string,
    newStatus: PurchaseOrderStatus
  ) => {
    try {
      await statusMutation.mutateAsync({ id, status: newStatus })
      toast.success(t("statusUpdateSuccess"))
    } catch (err) {
      console.error("[PurchaseOrdersContainer] status update failed", err)
      toast.error(getErrorMessage(err, t("statusUpdateError")))
    }
  }

  const renderStatusBadge = (poStatus: PurchaseOrderStatus) => {
    const config = getStatusConfig(poStatus, t)
    const Icon = config.icon
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-2xs select-none",
          config.styles
        )}
      >
        <Icon className={cn("size-3.5 shrink-0", config.iconColor)} />
        <span>{config.label}</span>
      </span>
    )
  }

  const renderStatusCell = (po: ApiPurchaseOrder) => {
    const isTerminal = po.status === "received" || po.status === "cancelled"
    if (isTerminal) {
      return renderStatusBadge(po.status)
    }

    const availableStatuses: PurchaseOrderStatus[] =
      po.status === "draft"
        ? ["draft", "sent", "received", "cancelled"]
        : ["sent", "received", "cancelled"]

    const config = getStatusConfig(po.status, t)
    const Icon = config.icon

    return (
      <div className="inline-block" onClick={(e) => e.stopPropagation()}>
        <Select
          value={po.status}
          onValueChange={(val) => {
            if (!val || val === po.status) return
            if (val === "received") {
              setReceiveTarget(po)
            } else if (val === "cancelled") {
              setCancelTarget(po)
            } else {
              handleStatusUpdate(po._id, val as PurchaseOrderStatus)
            }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-7 w-auto cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-2xs outline-hidden transition-colors focus:ring-1 focus:ring-ring",
              config.styles
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon className={cn("size-3.5 shrink-0", config.iconColor)} />
              <span>{config.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent
            align="center"
            className="min-w-[140px] rounded-xl p-1"
          >
            {availableStatuses.map((s) => {
              const itemConfig = getStatusConfig(s, t)
              const ItemIcon = itemConfig.icon
              return (
                <SelectItem
                  key={s}
                  value={s}
                  className="rounded-lg text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ItemIcon
                      className={cn("size-3.5 shrink-0", itemConfig.iconColor)}
                    />
                    <span>{itemConfig.label}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("title")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {isFiltered
                ? t("itemsCountFiltered", { showing: orders.length, total })
                : t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/purchase-orders/new" />}
          className="gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          <span>{t("addPO")}</span>
        </Button>
      </div>

      {/* Control Bar */}
      <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-full min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="rounded-xl ps-9"
            />
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="size-4" />
                  <span>{t("filters")}</span>
                  {activeFilterCount > 0 && (
                    <Badge className="flex size-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent
              side="right"
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b border-border bg-card/60 p-5 text-start">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Filter className="size-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold">
                      {t("filtersTitle")}
                    </SheetTitle>
                    <SheetDescription>
                      {t("filtersDescription")}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {/* Status Filter */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                  <Label
                    htmlFor="po-status-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Clock className="size-3.5 text-primary" />
                    <span>{t("status")}</span>
                  </Label>
                  <Select
                    value={status || "all"}
                    onValueChange={(val) => {
                      setStatus(
                        val === "all" ? "" : (val as PurchaseOrderStatus)
                      )
                      setPage(1)
                    }}
                  >
                    <SelectTrigger
                      id="po-status-filter"
                      className="h-9 w-full rounded-xl text-xs"
                    >
                      <SelectValue placeholder={t("allStatuses")}>
                        {status
                          ? getStatusConfig(status, t).label
                          : t("allStatuses")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allStatuses")}</SelectItem>
                      <SelectItem value="draft">{t("statusDraft")}</SelectItem>
                      <SelectItem value="sent">{t("statusSent")}</SelectItem>
                      <SelectItem value="received">
                        {t("statusReceived")}
                      </SelectItem>
                      <SelectItem value="cancelled">
                        {t("statusCancelled")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Filter */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                  <Label
                    htmlFor="po-supplier-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Truck className="size-3.5 text-primary" />
                    <span>{t("supplier")}</span>
                  </Label>
                  <PaginatedSupplierSelect
                    id="po-supplier-filter"
                    value={supplierId}
                    onValueChange={(val) => {
                      setSupplierId(val)
                      setPage(1)
                    }}
                    allowAllOption
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border bg-card/60 p-5">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full gap-2 rounded-xl"
                >
                  <RotateCcw className="size-4" />
                  <span>{t("resetFilters")}</span>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-h-[70vh] w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              {t("retry")}
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageX className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("noOrdersMatchFilters")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("filtersDescription")}
              </p>
            </div>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2 gap-2 rounded-xl text-xs"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("clearFilters")}</span>
              </Button>
            )}
          </div>
        ) : (
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
              <TableRow>
                <TableHead className="w-[120px] text-start">
                  {t("colPoId")}
                </TableHead>
                <TableHead className="w-[200px] text-start">
                  {t("colSupplier")}
                </TableHead>
                <TableHead className="w-[90px] text-center">
                  {t("colItems")}
                </TableHead>
                <TableHead className="w-[120px] px-4 text-end">
                  {t("colTotalCost")}
                </TableHead>
                <TableHead className="w-[120px] text-center">
                  {t("colStatus")}
                </TableHead>
                <TableHead className="w-[140px] text-start">
                  {t("colExpectedDelivery")}
                </TableHead>
                <TableHead className="w-[140px] text-start">
                  {t("colCreatedAt")}
                </TableHead>
                <TableHead className="w-[60px] text-center">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((po: ApiPurchaseOrder) => {
                const totalCost = calculateOrderTotal(po)
                const supplierName = getSupplierName(po.supplierId)

                return (
                  <TableRow
                    key={po._id}
                    onClick={(e) => handleRowClick(po._id, e)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      PO-{po._id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {supplierName}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {po.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="px-4 text-end font-semibold">
                      {formatCurrency(totalCost, locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusCell(po)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {po.expectedDeliveryDate
                        ? formatDate(po.expectedDeliveryDate, locale)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(po.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/dashboard/purchase-orders/${po._id}`}
                            aria-label={t("viewDetails")}
                          />
                        }
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Footer */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />

      {/* Receive Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(receiveTarget)}
        onOpenChange={(open) => {
          if (!open) setReceiveTarget(null)
        }}
        onConfirm={handleConfirmReceive}
        variant="default"
        icon={
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <PackageCheck className="size-5" />
          </div>
        }
        title={t("receiveConfirmTitle")}
        description={t("receiveConfirmDesc")}
        confirmText={t("confirmReceive")}
        cancelText={t("cancel")}
        isLoading={receiveMutation.isPending}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
        onConfirm={handleConfirmCancel}
        variant="destructive"
        icon={
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle className="size-5" />
          </div>
        }
        title={t("cancelConfirmTitle")}
        description={t("cancelConfirmDesc")}
        confirmText={t("confirmCancel")}
        cancelText={t("cancel")}
        isLoading={statusMutation.isPending}
      />
    </div>
  )
}
