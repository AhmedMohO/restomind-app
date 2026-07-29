"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import { getErrorMessage } from "@/lib/api/utils"
import {
  useCreateStockTransaction,
  useInventoryBatches,
} from "@/features/inventory/hooks/use-inventory"
import {
  IngredientUnitEnum,
  StockTransactionTypeEnum,
  WasteReasonEnum,
  type CreateStockTransactionInput,
  InventoryBatch,
} from "@/features/inventory/types"

export interface CreateTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients?: Array<{ _id: string; name: string; unit: string }>
}

const TRANSACTION_TYPES = Object.values(StockTransactionTypeEnum)
const UNITS = Object.values(IngredientUnitEnum)
const WASTE_REASONS = Object.values(WasteReasonEnum)

export function CreateTransactionDialog({
  open,
  onOpenChange,
  ingredients = [],
}: CreateTransactionDialogProps) {
  const t = useTranslations("Dashboard.inventory")
  const locale = useLocale()

  const createTransactionMutation = useCreateStockTransaction()
  const isPending = createTransactionMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateStockTransactionInput>({
    defaultValues: {
      ingredientId: "",
      batchId: "",
      transactionType: StockTransactionTypeEnum.PURCHASE,
      quantity: 1,
      unit: IngredientUnitEnum.KG,
      date: new Date().toISOString().split("T")[0],
    },
  })

  const selectedIngredientId = useWatch({ control, name: "ingredientId" })
  const selectedType = useWatch({ control, name: "transactionType" })
  const selectedUnit = useWatch({ control, name: "unit" })
  const selectedWasteReason = useWatch({ control, name: "wasteReason" })
  const txnDate = useWatch({ control, name: "date" })

  // Query batches for the selected ingredient
  const { data: batchesData } = useInventoryBatches({
    ingredientId: selectedIngredientId || undefined,
    limit: 100,
  })

  const batches: InventoryBatch[] = batchesData?.items ?? []

  React.useEffect(() => {
    if (open) {
      const firstIng = ingredients[0]
      reset({
        ingredientId: firstIng?._id ?? "",
        batchId: "",
        transactionType: StockTransactionTypeEnum.PURCHASE,
        quantity: 1,
        unit: (firstIng?.unit as IngredientUnitEnum) || IngredientUnitEnum.KG,
        date: new Date().toISOString().split("T")[0],
      })
    }
  }, [open, ingredients, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!values.ingredientId) {
      toast.error(t("selectIngredientError"))
      return
    }

    try {
      await createTransactionMutation.mutateAsync({
        ...values,
        batchId: values.batchId || undefined,
        quantity: Number(values.quantity),
        date: values.date ? new Date(values.date).toISOString() : undefined,
        estimatedCost: values.estimatedCost
          ? Number(values.estimatedCost)
          : undefined,
      })
      toast.success(t("transactionCreateSuccess"))
      onOpenChange(false)
    } catch (err) {
      console.error("[CreateTransactionDialog] submit error:", err)
      toast.error(getErrorMessage(err, t("transactionCreateError")))
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v)
      }}
    >
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-start font-heading text-base font-bold sm:text-lg">
            {t("addTransactionTitle")}
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-muted-foreground">
            {t("addTransactionDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.ingredientId}>
              <FieldLabel>{t("ingredientLabel")} *</FieldLabel>
              <PaginatedIngredientSelect
                value={selectedIngredientId}
                onValueChange={(val, ing) => {
                  if (val) {
                    setValue("ingredientId", val, { shouldValidate: true })
                    if (ing?.unit) {
                      setValue("unit", ing.unit as IngredientUnitEnum)
                    }
                    setValue("batchId", "")
                  }
                }}
                disabled={isPending}
                placeholder={t("selectIngredientPlaceholder")}
                className="h-10 w-full rounded-xl text-xs"
              />
              <FieldError errors={[errors.ingredientId]} />
            </Field>

            <Field data-invalid={!!errors.transactionType}>
              <FieldLabel>{t("transactionTypeLabel")} *</FieldLabel>
              <Select
                value={selectedType}
                onValueChange={(val) => {
                  if (val) {
                    setValue(
                      "transactionType",
                      val as StockTransactionTypeEnum,
                      {
                        shouldValidate: true,
                      }
                    )
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`type_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.transactionType]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("batchIdLabel")}</FieldLabel>
              <Select
                value={useWatch({ control, name: "batchId" }) || "none"}
                onValueChange={(val) => {
                  if (val) setValue("batchId", val === "none" ? "" : val)
                }}
                disabled={isPending || !selectedIngredientId}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue placeholder={t("noneBatch")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noneBatch")}</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.batchNumber} (Rem: {batch.quantityRemaining})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={!!errors.quantity}>
              <FieldLabel htmlFor="txn-qty">{t("quantityLabel")} *</FieldLabel>
              <Input
                id="txn-qty"
                type="number"
                step="0.0001"
                min="0.0001"
                {...register("quantity", { required: true, min: 0.0001 })}
                disabled={isPending}
              />
              <FieldError errors={[errors.quantity]} />
            </Field>
          </div>

          <div className="grid hidden gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.unit}>
              <FieldLabel>{t("unitLabel")} *</FieldLabel>
              <Select
                value={selectedUnit}
                onValueChange={(val) =>
                  setValue("unit", val as IngredientUnitEnum)
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.unit]} />
            </Field>

            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="txn-date">{t("dateLabel")}</FieldLabel>
              <DatePicker
                value={txnDate}
                onChange={(val) =>
                  setValue("date", val || "", { shouldValidate: true })
                }
                placeholder={t("dateLabel")}
                disabled={isPending}
                className="h-10 w-full rounded-xl text-xs"
              />
              <FieldError errors={[errors.date]} />
            </Field>
          </div>

          {selectedType === StockTransactionTypeEnum.WASTE && (
            <div className="grid gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("wasteReasonLabel")}</FieldLabel>
                <Select
                  value={selectedWasteReason || WasteReasonEnum.EXPIRED}
                  onValueChange={(val) =>
                    setValue("wasteReason", val as WasteReasonEnum)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue className="h-full" />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTE_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`reason_${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="est-cost">
                  {t("estimatedCostLabel")}
                </FieldLabel>
                <Input
                  id="est-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("estimatedCost")}
                  disabled={isPending}
                  className="bg-background"
                />
              </Field>
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full rounded-xl text-xs sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              <span>{t("createTransactionButton")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
