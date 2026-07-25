"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

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
import { getErrorMessage } from "@/lib/api/utils"
import { useZodResolver } from "@/lib/zod-locale"
import {
  ingredientFormSchema,
  type IngredientFormInput,
} from "@/schemas/ingredient"
import {
  INGREDIENT_UNITS,
  type ApiIngredient,
  type IngredientUnit,
} from "@/features/ingredients/api/type"
import {
  useCreateIngredient,
  useUpdateIngredient,
} from "@/features/ingredients/hooks/use-ingredients"

export interface IngredientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present in edit mode, `null` in create mode. */
  ingredient?: ApiIngredient | null
}

const EMPTY_VALUES: IngredientFormInput = {
  ingredientCode: "",
  name: "",
  unit: "kg",
  shelfLifeDays: 0,
  minimumStock: 0,
  safetyStock: 0,
}

function toFormValues(ingredient?: ApiIngredient | null): IngredientFormInput {
  if (!ingredient) return EMPTY_VALUES
  return {
    ingredientCode: ingredient.ingredientCode ?? "",
    name: ingredient.name ?? "",
    unit: ingredient.unit ?? "kg",
    shelfLifeDays: ingredient.shelfLifeDays ?? 0,
    minimumStock: ingredient.minimumStock ?? 0,
    safetyStock: ingredient.safetyStock ?? 0,
  }
}

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient = null,
}: IngredientFormDialogProps) {
  const t = useTranslations("Dashboard.ingredients")
  const locale = useLocale()
  const isEdit = Boolean(ingredient)

  const createMutation = useCreateIngredient()
  const updateMutation = useUpdateIngredient()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<IngredientFormInput>({
    resolver: useZodResolver(ingredientFormSchema),
    defaultValues: toFormValues(ingredient),
  })

  // Re-seed the form whenever the dialog opens or switches target, so a
  // cancelled edit never leaks its values into the next create.
  React.useEffect(() => {
    if (open) reset(toFormValues(ingredient))
  }, [open, ingredient, reset])

  const unit = useWatch({ control, name: "unit" })

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && ingredient) {
        await updateMutation.mutateAsync({ id: ingredient._id, payload: values })
        toast.success(t("updateSuccess"))
      } else {
        await createMutation.mutateAsync(values)
        toast.success(t("createSuccess"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[IngredientFormDialog] submit failed", err)
      // Surfaces backend conflicts verbatim (e.g. duplicate ingredient code).
      toast.error(
        getErrorMessage(err, isEdit ? t("updateError") : t("createError"))
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-start font-heading text-base font-bold sm:text-lg">
            {isEdit ? t("editIngredient") : t("addIngredient")}
          </DialogTitle>
          <DialogDescription className="text-start text-xs text-muted-foreground">
            {t("formDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.ingredientCode}>
              <FieldLabel htmlFor="ingredient-code">
                {t("colCode")} *
              </FieldLabel>
              <Input
                id="ingredient-code"
                placeholder={t("codePlaceholder")}
                autoComplete="off"
                {...register("ingredientCode")}
                disabled={isPending}
              />
              <FieldError errors={[errors.ingredientCode]} />
            </Field>

            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="ingredient-name">{t("colName")} *</FieldLabel>
              <Input
                id="ingredient-name"
                placeholder={t("namePlaceholder")}
                autoComplete="off"
                {...register("name")}
                disabled={isPending}
              />
              <FieldError errors={[errors.name]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.unit}>
              <FieldLabel>{t("colUnit")} *</FieldLabel>
              <Select
                value={unit}
                onValueChange={(value) => {
                  if (value) {
                    setValue("unit", value as IngredientUnit, {
                      shouldValidate: true,
                    })
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue>{t(`unit_${unit}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`unit_${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[errors.unit]} />
            </Field>

            <Field data-invalid={!!errors.shelfLifeDays}>
              <FieldLabel htmlFor="ingredient-shelf-life">
                {t("colShelfLife")} *
              </FieldLabel>
              <Input
                id="ingredient-shelf-life"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                {...register("shelfLifeDays")}
                disabled={isPending}
              />
              <FieldError errors={[errors.shelfLifeDays]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.minimumStock}>
              <FieldLabel htmlFor="ingredient-min-stock">
                {t("colMinimumStock")}
              </FieldLabel>
              <Input
                id="ingredient-min-stock"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                {...register("minimumStock")}
                disabled={isPending}
              />
              <FieldError errors={[errors.minimumStock]} />
            </Field>

            <Field data-invalid={!!errors.safetyStock}>
              <FieldLabel htmlFor="ingredient-safety-stock">
                {t("colSafetyStock")}
              </FieldLabel>
              <Input
                id="ingredient-safety-stock"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                {...register("safetyStock")}
                disabled={isPending}
              />
              <FieldError errors={[errors.safetyStock]} />
            </Field>
          </div>

          <DialogFooter className="mt-2 flex gap-2">
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
                <Save className="size-4" />
              )}
              <span>{isEdit ? t("saveChanges") : t("createIngredient")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
