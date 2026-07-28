"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  PackageCheck,
  PackageX,
  Truck,
  User,
  XCircle,
} from "lucide-react"

import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"
import type { PurchaseOrderStatus } from "../types"
import {
  usePurchaseOrderById,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrderStatus,
} from "../hooks/use-purchase-orders"
import {
  calculateOrderTotal,
  getIngredientDetails,
  getStatusConfig,
  getSupplierDetails,
  getUserDetails,
} from "../utils"

export function PurchaseOrderDetailsContainer({ id }: { id: string }) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.purchaseOrders")

  const { data: po, isLoading, isError, refetch } = usePurchaseOrderById(id)
  const receiveMutation = useReceivePurchaseOrder()
  const statusMutation = useUpdatePurchaseOrderStatus()

  const [showReceiveConfirm, setShowReceiveConfirm] = React.useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false)

  const handleConfirmReceive = async () => {
    if (!po) return
    try {
      await receiveMutation.mutateAsync(po._id)
      toast.success(t("receiveSuccess"))
      setShowReceiveConfirm(false)
    } catch (err) {
      console.error("[PurchaseOrderDetailsContainer] receive failed", err)
      toast.error(getErrorMessage(err, t("receiveError")))
    }
  }

  const handleConfirmCancel = async () => {
    if (!po) return
    try {
      await statusMutation.mutateAsync({ id: po._id, status: "cancelled" })
      toast.success(t("statusUpdateSuccess"))
      setShowCancelConfirm(false)
    } catch (err) {
      console.error("[PurchaseOrderDetailsContainer] cancel failed", err)
      toast.error(getErrorMessage(err, t("statusUpdateError")))
    }
  }

  const handleStatusUpdate = async (newStatus: PurchaseOrderStatus) => {
    if (!po) return
    try {
      await statusMutation.mutateAsync({ id: po._id, status: newStatus })
      toast.success(t("statusUpdateSuccess"))
    } catch (err) {
      console.error("[PurchaseOrderDetailsContainer] status update failed", err)
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

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !po) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <PackageX className="size-10 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          {t("detailFetchError")}
        </p>
        <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
          {t("retry")}
        </Button>
      </div>
    )
  }

  const supplier = getSupplierDetails(po.supplierId)
  const creator = getUserDetails(po.createdBy)
  const totalCost = calculateOrderTotal(po)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Navigation & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/purchase-orders" aria-label={t("backToList")} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-primary">
                PO-{po._id.slice(-6).toUpperCase()}
              </h1>
              {renderStatusBadge(po.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("createdDate")}: {formatDate(po.createdAt, locale)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {po.status !== "received" && po.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            {po.status === "draft" && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate("sent")}
                disabled={statusMutation.isPending}
                className="gap-2 rounded-xl text-xs"
              >
                <Truck className="size-3.5 text-blue-600" />
                <span>{t("markSent")}</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              disabled={statusMutation.isPending}
              className="gap-2 rounded-xl border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <XCircle className="size-3.5" />
              <span>{t("cancelPO")}</span>
            </Button>

            <Button
              onClick={() => setShowReceiveConfirm(true)}
              className="gap-2 rounded-xl text-xs"
            >
              <PackageCheck className="size-4" />
              <span>{t("markReceived")}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Supplier Card */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Truck className="size-4 text-primary" />
              <span>{t("supplier")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-bold text-foreground">{supplier.name}</p>
            {supplier.phone && (
              <p className="text-xs text-muted-foreground">{supplier.phone}</p>
            )}
            {supplier.email && (
              <p className="text-xs text-muted-foreground">{supplier.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Created By Card */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <User className="size-4 text-primary" />
              <span>{t("createdBy")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-bold text-foreground">{creator.name}</p>
            {creator.email && (
              <p className="text-xs text-muted-foreground">{creator.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Dates & Financial Card */}
        <Card className="rounded-2xl border-border bg-card shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Calendar className="size-4 text-primary" />
              <span>{t("expectedDeliveryDate")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-bold text-foreground">
              {po.expectedDeliveryDate
                ? formatDate(po.expectedDeliveryDate, locale)
                : "-"}
            </p>
            <div className="pt-2 text-end">
              <span className="text-[10px] text-muted-foreground">
                {t("totalCost")}
              </span>
              <p className="text-lg font-extrabold text-primary">
                {formatCurrency(totalCost, locale)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Breakdown Table */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader>
          <CardTitle className="text-base font-bold">{t("itemsList")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead className="text-start">{t("colIngredient")}</TableHead>
                <TableHead className="text-center">{t("colQtyUnit")}</TableHead>
                <TableHead className="px-4 text-end">{t("colUnitCost")}</TableHead>
                <TableHead className="px-4 text-end">{t("colLineTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item, index) => {
                const ing = getIngredientDetails(item.ingredientId)
                const lineTotal = item.quantity * item.unitCost

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-foreground">
                      <div className="space-y-0.5">
                        <p className="font-semibold">{ing.name}</p>
                        {ing.code && (
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {ing.code}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.quantity} {t(`unit_${item.unit}` as any) || item.unit}
                    </TableCell>
                    <TableCell className="px-4 text-end font-medium">
                      {formatCurrency(item.unitCost, locale)}
                    </TableCell>
                    <TableCell className="px-4 text-end font-bold text-foreground">
                      {formatCurrency(lineTotal, locale)}
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="border-t-2 bg-muted/30">
                <TableCell colSpan={3} className="font-bold text-foreground">
                  {t("totalCost")}
                </TableCell>
                <TableCell className="px-4 text-end text-base font-extrabold text-primary">
                  {formatCurrency(totalCost, locale)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Confirmation Dialog */}
      <ConfirmDialog
        open={showReceiveConfirm}
        onOpenChange={setShowReceiveConfirm}
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
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
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
