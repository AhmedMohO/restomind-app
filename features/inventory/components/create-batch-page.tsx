"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Archive,
  Calendar,
  CalendarDays,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import { Link, useRouter } from "@/i18n/routing"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"
import type { CreateBatchInput } from "../types"
import { useCreateBatch } from "../hooks/use-inventory"

interface BatchFormRow {
  id: string
  ingredientId: string
  ingredientUnit: string
  batchNumber: string
  quantityRemaining: number
  unitCost: number
  expiryDate: string
  receivedDate: string
}

function generateBatchNumber(index: number): string {
  const ts = Date.now().toString().slice(-6)
  return `BATCH-${ts}-${index + 1}`
}

function makeEmptyRow(index: number): BatchFormRow {
  return {
    id: `row-${index}-${Math.random()}`,
    ingredientId: "",
    ingredientUnit: "",
    batchNumber: generateBatchNumber(index),
    quantityRemaining: 1,
    unitCost: 0,
    expiryDate: "",
    receivedDate: "",
  }
}

export function CreateBatchPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Dashboard.inventory")

  const [rows, setRows] = React.useState<BatchFormRow[]>(() => [
    makeEmptyRow(0),
  ])
  const createMutation = useCreateBatch()

  const handleAddRow = () => {
    setRows((prev) => [...prev, makeEmptyRow(prev.length)])
  }

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleUpdateRow = <K extends keyof BatchFormRow>(
    id: string,
    field: K,
    value: BatchFormRow[K]
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const totalValue = React.useMemo(
    () => rows.reduce((sum, r) => sum + r.quantityRemaining * r.unitCost, 0),
    [rows]
  )

  const selectedIngredientIds = rows.map((r) => r.ingredientId).filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rows.some((r) => !r.ingredientId)) {
      toast.error(t("selectIngredientFirst"))
      return
    }
    if (rows.some((r) => r.quantityRemaining <= 0)) {
      toast.error(t("validQuantityError"))
      return
    }
    if (rows.some((r) => !r.expiryDate)) {
      toast.error(t("validExpiryError"))
      return
    }

    const batches: CreateBatchInput[] = rows.map((r) => ({
      ingredientId: r.ingredientId,
      batchNumber: r.batchNumber.trim() || generateBatchNumber(rows.indexOf(r)),
      quantityRemaining: r.quantityRemaining,
      unitCost: r.unitCost,
      expiryDate: r.expiryDate,
      ...(r.receivedDate ? { receivedDate: r.receivedDate } : {}),
    }))

    try {
      // Backend accepts { batches: [...] } — cast via CreateBatchesDto shape
      await createMutation.mutateAsync({
        batches,
      } as unknown as CreateBatchInput)
      toast.success(t("batchesCreateSuccess"))
      router.push("/dashboard/inventory")
    } catch (err) {
      console.error("[CreateBatchPage] create failed", err)
      toast.error(getErrorMessage(err, t("batchesCreateError")))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Items Card */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Package className="size-4 text-primary" />
              <span>{t("batchItems")}</span>
            </CardTitle>
            <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2.5 text-xs font-bold text-primary">
              {rows.length}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="gap-1.5 rounded-xl text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="size-3.5" />
            <span>{t("addBatchRow")}</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="group relative space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs sm:p-5"
            >
              {/* Card Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-extrabold text-primary">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {row.batchNumber || `Batch Item #${index + 1}`}
                    </span>
                    {row.quantityRemaining > 0 && row.unitCost > 0 && (
                      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          row.quantityRemaining * row.unitCost,
                          locale
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={rows.length <= 1}
                  onClick={() => handleRemoveRow(row.id)}
                  title={t("removeBatchRow")}
                  className="h-8 gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="size-3.5" />
                  <span>{t("removeBatchRow")}</span>
                </Button>
              </div>

              {/* Form Fields Responsive Grid */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-7">
                {/* Ingredient */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {t("colIngredient")} *
                  </Label>
                  <PaginatedIngredientSelect
                    value={row.ingredientId}
                    onValueChange={(val, ingredient) => {
                      handleUpdateRow(row.id, "ingredientId", val)
                      if (ingredient?.unit) {
                        handleUpdateRow(
                          row.id,
                          "ingredientUnit",
                          ingredient.unit
                        )
                      }
                    }}
                    excludeIds={selectedIngredientIds.filter(
                      (id) => id !== row.ingredientId
                    )}
                    className="h-10 w-full rounded-xl"
                  />
                </div>

                {/* Batch Number */}
                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {t("batchNumberLabel")}
                  </Label>
                  <Input
                    value={row.batchNumber}
                    onChange={(e) =>
                      handleUpdateRow(row.id, "batchNumber", e.target.value)
                    }
                    placeholder={t("batchNumberPlaceholder")}
                    className="h-10 w-full rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {t("quantityLabel")} *
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={row.quantityRemaining || ""}
                      onChange={(e) =>
                        handleUpdateRow(
                          row.id,
                          "quantityRemaining",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-10 w-full rounded-xl pe-8 text-xs font-medium"
                    />
                    {row.ingredientUnit && (
                      <span className="pointer-events-none absolute end-2.5 text-[9px] font-bold text-muted-foreground uppercase select-none">
                        {row.ingredientUnit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unit Cost */}
                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {t("unitCostLabel")} *
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.unitCost || ""}
                      onChange={(e) =>
                        handleUpdateRow(
                          row.id,
                          "unitCost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-10 w-full rounded-xl pe-9 text-xs font-medium"
                    />
                    <span className="pointer-events-none absolute end-2.5 text-[9px] font-bold text-muted-foreground select-none">
                      EGP
                    </span>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <Label className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <Calendar className="size-3" />
                    {t("expiryDateLabel")} *
                  </Label>
                  <DatePicker
                    value={row.expiryDate}
                    onChange={(val) =>
                      handleUpdateRow(row.id, "expiryDate", val ?? "")
                    }
                    placeholder={t("expiryDateLabel")}
                    className="h-10 w-full rounded-xl text-xs"
                  />
                </div>

                {/* Received Date */}
                <div className="space-y-1.5 sm:col-span-1 lg:col-span-1 xl:col-span-1">
                  <Label className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <CalendarDays className="size-3" />
                    {t("receivedDateLabel")}
                  </Label>
                  <DatePicker
                    value={row.receivedDate}
                    onChange={(val) =>
                      handleUpdateRow(row.id, "receivedDate", val ?? "")
                    }
                    placeholder={t("receivedDateLabel")}
                    className="h-10 w-full rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-2xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Archive className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {t("batchSummaryTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("batchesSelected", { count: rows.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-end">
            <div>
              <span className="block text-xs font-medium text-muted-foreground">
                {t("totalBatchValue")}
              </span>
              <p className="text-2xl font-black tracking-tight text-primary">
                {formatCurrency(totalValue, locale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/inventory" />}
          className="rounded-xl"
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="gap-2 rounded-xl"
        >
          {createMutation.isPending && (
            <Loader2 className="size-4 animate-spin" />
          )}
          <span>{t("submitBatches")}</span>
        </Button>
      </div>
    </form>
  )
}
