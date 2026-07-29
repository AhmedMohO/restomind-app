"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, Loader2 } from "lucide-react"

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
  useCreateWasteEvent,
  useInventoryBatches,
} from "@/features/inventory/hooks/use-inventory"
import {
  IngredientUnitEnum,
  WasteReasonEnum,
  type CreateWasteEventInput,
  InventoryBatch,
} from "@/features/inventory/types"

export interface CreateWasteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients?: Array<{ _id: string; name: string; unit: string }>
}

const UNITS = Object.values(IngredientUnitEnum)
const WASTE_REASONS = Object.values(WasteReasonEnum)

export function CreateWasteDialog({
  open,
  onOpenChange,
  ingredients = [],
}: CreateWasteDialogProps) {
  const t = useTranslations("Dashboard.inventory")
  const locale = useLocale()

  const createWasteMutation = useCreateWasteEvent()
  const isPending = createWasteMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateWasteEventInput>({
    defaultValues: {
      ingredientId: "",
      batchId: "",
      quantity: 1,
      unit: IngredientUnitEnum.KG,
      wasteReason: WasteReasonEnum.SPOILED,
      estimatedCost: 0,
      date: new Date().toISOString().split("T")[0],
    },
  })

  const selectedIngredientId = useWatch({ control, name: "ingredientId" })
  const selectedUnit = useWatch({ control, name: "unit" })
  const selectedWasteReason = useWatch({ control, name: "wasteReason" })
  const wasteDate = useWatch({ control, name: "date" })

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
        quantity: 1,
        unit: (firstIng?.unit as IngredientUnitEnum) || IngredientUnitEnum.KG,
        wasteReason: WasteReasonEnum.SPOILED,
        estimatedCost: 0,
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
      await createWasteMutation.mutateAsync({
        ...values,
        batchId: values.batchId || undefined,
        quantity: Number(values.quantity),
        estimatedCost: Number(values.estimatedCost),
        date: values.date ? new Date(values.date).toISOString() : undefined,
      })
      toast.success(t("wasteCreateSuccess"))
      onOpenChange(false)
    } catch (err) {
      console.error("[CreateWasteDialog] submit error:", err)
      toast.error(getErrorMessage(err, t("wasteCreateError")))
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
          <DialogTitle className="flex items-center gap-2 text-start font-heading text-base font-bold text-destructive sm:text-lg">
            <AlertTriangle className="size-5" />
            <span>{t("addWasteTitle")}</span>
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-muted-foreground">
            {t("addWasteDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

            <Field data-invalid={!!errors.wasteReason}>
              <FieldLabel>{t("wasteReasonLabel")} *</FieldLabel>
              <Select
                value={selectedWasteReason}
                onValueChange={(val) => {
                  if (val) {
                    setValue("wasteReason", val as WasteReasonEnum, {
                      shouldValidate: true,
                    })
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`reason_${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.wasteReason]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.quantity}>
              <FieldLabel htmlFor="wst-qty">{t("quantityLabel")} *</FieldLabel>
              <Input
                id="wst-qty"
                type="number"
                step="0.0001"
                min="0.0001"
                {...register("quantity", { required: true, min: 0.0001 })}
                disabled={isPending}
              />
              <FieldError errors={[errors.quantity]} />
            </Field>

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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.estimatedCost}>
              <FieldLabel htmlFor="wst-cost">
                {t("estimatedCostLabel")} *
              </FieldLabel>
              <Input
                id="wst-cost"
                type="number"
                step="0.01"
                min="0"
                {...register("estimatedCost", { required: true, min: 0 })}
                disabled={isPending}
              />
              <FieldError errors={[errors.estimatedCost]} />
            </Field>

            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="wst-date">{t("dateLabel")}</FieldLabel>
              <DatePicker
                value={wasteDate}
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
              variant="destructive"
              disabled={isPending}
              className="w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              <span>{t("createWasteButton")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
