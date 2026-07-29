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
import { DatePicker } from "@/components/ui/date-picker"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import { getErrorMessage } from "@/lib/api/utils"
import { useCreateBatch } from "@/features/inventory/hooks/use-inventory"
import type { CreateBatchInput } from "@/features/inventory/types"

export interface CreateBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients?: Array<{ _id: string; name: string; unit: string }>
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  ingredients = [],
}: CreateBatchDialogProps) {
  const t = useTranslations("Dashboard.inventory")
  const locale = useLocale()

  const createBatchMutation = useCreateBatch()
  const isPending = createBatchMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateBatchInput>({
    defaultValues: {
      ingredientId: "",
      batchNumber: "",
      quantityRemaining: 1,
      unitCost: 0,
      expiryDate: "",
      receivedDate: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        ingredientId: ingredients[0]?._id ?? "",
        batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
        quantityRemaining: 1,
        unitCost: 0,
        expiryDate: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .split("T")[0],
        receivedDate: new Date().toISOString().split("T")[0],
      })
    }
  }, [open, ingredients, reset])

  const selectedIngredientId = useWatch({ control, name: "ingredientId" })
  const expiryDate = useWatch({ control, name: "expiryDate" })
  const receivedDate = useWatch({ control, name: "receivedDate" })

  const onSubmit = handleSubmit(async (values) => {
    if (!values.ingredientId) {
      toast.error(t("selectIngredientError"))
      return
    }

    try {
      await createBatchMutation.mutateAsync({
        ...values,
        quantityRemaining: Number(values.quantityRemaining),
        unitCost: Number(values.unitCost),
        expiryDate: new Date(values.expiryDate).toISOString(),
        receivedDate: values.receivedDate
          ? new Date(values.receivedDate).toISOString()
          : undefined,
      })
      toast.success(t("batchCreateSuccess"))
      onOpenChange(false)
    } catch (err) {
      console.error("[CreateBatchDialog] submit error:", err)
      toast.error(getErrorMessage(err, t("batchCreateError")))
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
            {t("addBatchTitle")}
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-muted-foreground">
            {t("addBatchDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field data-invalid={!!errors.ingredientId}>
            <FieldLabel>{t("ingredientLabel")} *</FieldLabel>
            <PaginatedIngredientSelect
              value={selectedIngredientId}
              onValueChange={(val) => {
                if (val) setValue("ingredientId", val, { shouldValidate: true })
              }}
              disabled={isPending}
              placeholder={t("selectIngredientPlaceholder")}
              className="h-10 w-full rounded-xl"
            />
            <FieldError errors={[errors.ingredientId]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.batchNumber}>
              <FieldLabel htmlFor="batch-number">
                {t("batchNumberLabel")} *
              </FieldLabel>
              <Input
                id="batch-number"
                placeholder="e.g. BATCH-001"
                {...register("batchNumber", { required: true })}
                disabled={isPending}
              />
              <FieldError errors={[errors.batchNumber]} />
            </Field>

            <Field data-invalid={!!errors.quantityRemaining}>
              <FieldLabel htmlFor="batch-qty">
                {t("quantityLabel")} *
              </FieldLabel>
              <Input
                id="batch-qty"
                type="number"
                step="0.01"
                min="0"
                {...register("quantityRemaining", { required: true, min: 0 })}
                disabled={isPending}
              />
              <FieldError errors={[errors.quantityRemaining]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.unitCost}>
              <FieldLabel htmlFor="unit-cost">
                {t("unitCostLabel")} *
              </FieldLabel>
              <Input
                id="unit-cost"
                type="number"
                step="0.01"
                min="0"
                {...register("unitCost", { required: true, min: 0 })}
                disabled={isPending}
              />
              <FieldError errors={[errors.unitCost]} />
            </Field>

            <Field data-invalid={!!errors.expiryDate}>
              <FieldLabel htmlFor="expiry-date">
                {t("expiryDateLabel")} *
              </FieldLabel>
              <DatePicker
                value={expiryDate}
                onChange={(val) =>
                  setValue("expiryDate", val || "", { shouldValidate: true })
                }
                placeholder={t("expiryDateLabel")}
                disabled={isPending}
                className="h-10 w-full rounded-xl"
              />
              <FieldError errors={[errors.expiryDate]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.receivedDate}>
            <FieldLabel htmlFor="received-date">
              {t("receivedDateLabel")}
            </FieldLabel>
            <DatePicker
              value={receivedDate}
              onChange={(val) =>
                setValue("receivedDate", val || "", { shouldValidate: true })
              }
              placeholder={t("receivedDateLabel")}
              disabled={isPending}
              className="h-10 w-full rounded-xl"
            />
            <FieldError errors={[errors.receivedDate]} />
          </Field>

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
              <span>{t("createBatchButton")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
