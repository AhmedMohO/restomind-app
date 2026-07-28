"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Calendar, Loader2, Plus, ShoppingBag, Trash2, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import { PaginatedSupplierSelect } from "@/features/suppliers/components/paginated-supplier-select"
import { Link, useRouter } from "@/i18n/routing"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"
import type {
  CreatePurchaseOrderItemInput,
  PurchaseOrderFormRowItem,
  PurchaseOrderStatus,
} from "../types"
import { useCreatePurchaseOrder } from "../hooks/use-purchase-orders"
import { calculateOrderTotal } from "../utils"

export function PurchaseOrderForm() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Dashboard.purchaseOrders")

  const [supplierId, setSupplierId] = React.useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState("")
  const [status, setStatus] = React.useState<PurchaseOrderStatus>("draft")

  const getStatusLabel = (s: PurchaseOrderStatus) => {
    switch (s) {
      case "draft":
        return t("statusDraft")
      case "sent":
        return t("statusSent")
      case "received":
        return t("statusReceived")
      case "cancelled":
        return t("statusCancelled")
      default:
        return s
    }
  }

  const [items, setItems] = React.useState<PurchaseOrderFormRowItem[]>([
    {
      id: "row-1",
      ingredientId: "",
      quantity: 1,
      unit: "kg",
      unitCost: 0,
    },
  ])

  const createMutation = useCreatePurchaseOrder()

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        ingredientId: "",
        quantity: 1,
        unit: "kg",
        unitCost: 0,
      },
    ])
  }

  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateRow = (
    id: string,
    field: keyof PurchaseOrderFormRowItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const totalCost = React.useMemo(() => {
    return calculateOrderTotal(items)
  }, [items])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supplierId) {
      toast.error(t("selectSupplier"))
      return
    }

    const validItems: CreatePurchaseOrderItemInput[] = items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitCost: Number(item.unitCost),
    }))

    if (validItems.some((item) => !item.ingredientId)) {
      toast.error(t("selectIngredient"))
      return
    }

    if (validItems.some((item) => item.quantity <= 0 || item.unitCost < 0)) {
      toast.error(t("validQuantityCostError"))
      return
    }

    const resetForm = () => {
      setSupplierId("")
      setExpectedDeliveryDate("")
      setStatus("draft")
      setItems([
        {
          id: "row-1",
          ingredientId: "",
          quantity: 1,
          unit: "kg",
          unitCost: 0,
        },
      ])
    }

    try {
      await createMutation.mutateAsync({
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        status,
        items: validItems,
      })
      toast.success(t("createSuccess"))
      resetForm()
      router.push("/dashboard/purchase-orders")
    } catch (err) {
      console.error("[PurchaseOrderForm] create failed", err)
      toast.error(getErrorMessage(err, t("createError")))
    }
  }

  const selectedIngredientIds = items.map((item) => item.ingredientId).filter(Boolean)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info Card */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Truck className="size-5 text-primary" />
            <span>{t("formTitle")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 items-center">
          {/* Supplier */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              <span>{t("supplier")}</span>
              <span className="text-destructive">*</span>
            </Label>
            <PaginatedSupplierSelect
              value={supplierId}
              onValueChange={(val) => setSupplierId(val)}
              className="h-10 w-full rounded-xl"
            />
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Calendar className="size-3.5 text-primary" />
              <span>{t("expectedDeliveryDate")}</span>
            </Label>
            <DatePicker
              value={expectedDeliveryDate}
              onChange={(val) => setExpectedDeliveryDate(val ?? "")}
              placeholder={t("expectedDeliveryDate")}
              minDate={new Date()}
              className="h-10 w-full rounded-xl text-xs"
            />
          </div>

          {/* Initial Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("status")}</Label>
            <Select
              value={status}
              onValueChange={(val) => {
                if (val) setStatus(val as PurchaseOrderStatus)
              }}
            >
              <SelectTrigger className="h-10 w-full rounded-xl text-xs">
                <SelectValue>{getStatusLabel(status)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("statusDraft")}</SelectItem>
                <SelectItem value="sent">{t("statusSent")}</SelectItem>
                <SelectItem value="received">{t("statusReceived")}</SelectItem>
                <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Breakdown Card */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-base font-bold">
              {t("itemsList")}
            </CardTitle>
            <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2.5 text-xs font-bold text-primary">
              {items.length}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItemRow}
            className="gap-1.5 rounded-xl text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="size-3.5" />
            <span>{t("addItem")}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Table Header for Desktop Screens */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">{t("colIngredient")}</div>
            <div className="col-span-2">{t("quantity")}</div>
            <div className="col-span-2">{t("unitCost")}</div>
            <div className="col-span-2 text-end">{t("itemTotal")}</div>
            <div className="col-span-1"></div>
          </div>

          {items.map((row, index) => {
            const lineTotal = (row.quantity || 0) * (row.unitCost || 0)

            return (
              <div
                key={row.id}
                className="group relative grid grid-cols-1 items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5 sm:grid-cols-12 hover:border-primary/40 hover:bg-card/90 transition-all shadow-2xs"
              >
                {/* Ingredient Select (5 cols) */}
                <div className="space-y-1.5 sm:col-span-5">
                  <div className="flex items-center justify-between sm:hidden">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      {t("colIngredient")} #{index + 1}
                    </Label>
                  </div>
                  <PaginatedIngredientSelect
                    value={row.ingredientId}
                    onValueChange={(val, ingredient) => {
                      handleUpdateRow(row.id, "ingredientId", val)
                      if (ingredient?.unit) {
                        handleUpdateRow(row.id, "unit", ingredient.unit)
                      }
                    }}
                    excludeIds={selectedIngredientIds}
                    className="h-10 w-full rounded-xl"
                  />
                </div>

                {/* Quantity (2 cols) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground sm:hidden">
                    {t("quantity")}
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={row.quantity || ""}
                      onChange={(e) =>
                        handleUpdateRow(
                          row.id,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-10 w-full rounded-xl text-xs pe-9 font-medium"
                    />
                    {row.unit && (
                      <span className="absolute end-2.5 text-[10px] font-semibold text-muted-foreground uppercase pointer-events-none select-none">
                        {row.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unit Cost (2 cols) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground sm:hidden">
                    {t("unitCost")}
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
                      className="h-10 w-full rounded-xl text-xs pe-10 font-medium"
                    />
                    <span className="absolute end-2.5 text-[10px] font-semibold text-muted-foreground pointer-events-none select-none">
                      EGP
                    </span>
                  </div>
                </div>

                {/* Line Total (2 cols) */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:col-span-2">
                  <span className="block text-[10px] text-muted-foreground sm:hidden">
                    {t("itemTotal")}
                  </span>
                  <div className="text-end">
                    <span className="inline-block rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground sm:bg-transparent sm:p-0">
                      {formatCurrency(lineTotal, locale)}
                    </span>
                  </div>
                </div>

                {/* Remove Action (1 col) */}
                <div className="flex items-center justify-end sm:justify-center sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length <= 1}
                    onClick={() => handleRemoveRow(row.id)}
                    title={t("removeItem") || "Remove item"}
                    className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs overflow-hidden">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-card via-card to-primary/5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {t("orderSummary")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("itemsSelected", { count: items.length })}
              </p>
            </div>
          </div>
          <div className="text-end">
            <span className="text-xs font-medium text-muted-foreground">
              {t("totalCost")}
            </span>
            <p className="text-2xl font-black tracking-tight text-primary">
              {formatCurrency(totalCost, locale)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/purchase-orders" />}
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
          <span>{t("saveChanges")}</span>
        </Button>
      </div>
    </form>
  )
}

