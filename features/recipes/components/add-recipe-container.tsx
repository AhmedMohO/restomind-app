"use client"

import * as React from "react"
import Image from "next/image"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { ChefHat, Loader2, Plus, Save, Trash2 } from "lucide-react"

import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "@/i18n/routing"
import { getErrorMessage } from "@/lib/api/utils"
import { formatCurrency } from "@/lib/utils"
import { useZodResolver } from "@/lib/zod-locale"
import { recipeFormSchema, type RecipeFormInput } from "@/schemas/recipe"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import type { IngredientUnit } from "@/features/ingredients/api/type"
import { PaginatedProductSelect } from "@/features/products/components/paginated-product-select"
import type { ApiProduct } from "@/features/products/api/type"
import {
  ApiRecipeIngredient,
  getGrossQuantity,
  getRecipeIngredient,
  getRecipeIngredientId,
} from "@/features/recipes/api/type"
import {
  useProductRecipe,
  useUpsertProductRecipe,
} from "@/features/recipes/hooks/use-recipes"

const EMPTY_ROW = {
  ingredientId: "",
  quantityPerPortion: 1,
  unit: "kg" as IngredientUnit,
  yieldPercentage: 100,
}

/** Trims floating-point noise (0.30000000000000004) without losing precision. */
function formatQuantity(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 1000) / 1000) : "—"
}

export function AddRecipeContainer() {
  const t = useTranslations("Dashboard.recipes")
  const tIngredients = useTranslations("Dashboard.ingredients")
  const locale = useLocale()
  const router = useRouter()

  const [productId, setProductId] = React.useState<string>("")
  const [selectedProduct, setSelectedProduct] = React.useState<ApiProduct | null>(null)
  const [productError, setProductError] = React.useState<string | null>(null)

  const { data: existingRecipe, isLoading: isRecipeLoading } = useProductRecipe(
    productId || null
  )

  const upsertMutation = useUpsertProductRecipe()

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormInput>({
    resolver: useZodResolver(recipeFormSchema),
    defaultValues: { ingredients: [EMPTY_ROW] },
  })

  // Prefill existing recipe if the selected product already has one, or reset when changed/cleared
  React.useEffect(() => {
    if (!productId) {
      reset({ ingredients: [EMPTY_ROW] })
      return
    }

    if (isRecipeLoading) return

    if (existingRecipe?.ingredients && existingRecipe.ingredients.length > 0) {
      const rows = existingRecipe.ingredients
        .map((line: ApiRecipeIngredient) => {
          const ingredient = getRecipeIngredient(line.ingredientId)
          return {
            ingredientId: getRecipeIngredientId(line.ingredientId),
            quantityPerPortion: line.quantityPerPortion,
            unit: (ingredient?.unit ?? line.unit) as IngredientUnit,
            yieldPercentage: line.yieldPercentage ?? 100,
          }
        })
        .filter((row) => row.ingredientId)

      if (rows.length > 0) {
        reset({ ingredients: rows })
        return
      }
    }

    reset({ ingredients: [EMPTY_ROW] })
  }, [productId, existingRecipe, isRecipeLoading, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  })

  const watchedRows = useWatch({ control, name: "ingredients" })

  const selectedIngredientIds = React.useMemo(
    () =>
      (watchedRows ?? [])
        .map((row) => row?.ingredientId)
        .filter(Boolean) as string[],
    [watchedRows]
  )

  const isPending = upsertMutation.isPending

  const resetFormState = React.useCallback(() => {
    setProductId("")
    setSelectedProduct(null)
    setProductError(null)
    reset({ ingredients: [EMPTY_ROW] })
  }, [reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!productId) {
      setProductError(t("productRequiredError"))
      return
    }
    setProductError(null)

    try {
      await upsertMutation.mutateAsync({
        productId,
        payload: {
          ingredients: values.ingredients.map((row) => ({
            ingredientId: row.ingredientId,
            quantityPerPortion: row.quantityPerPortion,
            unit: row.unit,
            yieldPercentage: row.yieldPercentage,
          })),
        },
      })
      toast.success(t("createSuccess"))
      resetFormState()
      router.push("/dashboard/recipes")
    } catch (err) {
      console.error("[AddRecipeContainer] save failed", err)
      toast.error(getErrorMessage(err, t("saveError")))
    }
  })

  const rootError = errors.ingredients?.root ?? errors.ingredients

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <BackButton href="/dashboard/recipes" aria-label={t("backToList")} />
          <div className="min-w-0 space-y-1">
            <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("addRecipe")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("addRecipeSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <Button
            type="submit"
            form="add-recipe-form"
            disabled={isPending || !productId}
            className="flex-1 gap-2 rounded-xl sm:flex-initial"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{t("saveRecipe")}</span>
          </Button>
        </div>
      </div>

      <form id="add-recipe-form" onSubmit={onSubmit} noValidate className="space-y-6">
        {/* Step 1: Select Product */}
        <Card className="rounded-3xl border-border/80 shadow-2xs">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {t("selectProduct")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field data-invalid={!!productError}>
              <FieldLabel>{t("selectProduct")} *</FieldLabel>
              <PaginatedProductSelect
                value={productId}
                placeholder={t("selectProductPlaceholder")}
                disabled={isPending}
                onValueChange={(value, product) => {
                  setProductId(value)
                  setSelectedProduct(product ?? null)
                  if (value) setProductError(null)
                }}
              />
              {productError && <FieldError>{productError}</FieldError>}
            </Field>

            {selectedProduct && (
              <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                {selectedProduct.image?.secure_url ? (
                  <div className="relative size-12 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image
                      fill
                      src={selectedProduct.image.secure_url}
                      alt={selectedProduct.title}
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {selectedProduct.title?.[0]?.toUpperCase() ?? "P"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">
                    {selectedProduct.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {typeof selectedProduct.category === "string"
                      ? "—"
                      : (selectedProduct.category?.name ?? "—")}{" "}
                    • {formatCurrency(selectedProduct.price, locale)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Recipe Ingredients */}
        <Card className="rounded-3xl border-border/80 shadow-2xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <ChefHat className="size-5 text-primary" />
              <span>{t("ingredientsTitle")}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("ingredientsDescription")}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const row = watchedRows?.[index]
              const rowErrors = errors.ingredients?.[index]
              const unitLabel = row?.unit
                ? tIngredients(`unit_${row.unit}`)
                : "—"
              const gross = getGrossQuantity(
                Number(row?.quantityPerPortion),
                Number(row?.yieldPercentage)
              )

              return (
                <div
                  key={field.id}
                  className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t("rowLabel", { index: index + 1 })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isPending || fields.length <= 1}
                      aria-label={t("removeRow")}
                      className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <Field data-invalid={!!rowErrors?.ingredientId}>
                      <FieldLabel>{t("colIngredient")} *</FieldLabel>
                      <PaginatedIngredientSelect
                        value={row?.ingredientId ?? ""}
                        excludeIds={selectedIngredientIds}
                        disabled={isPending}
                        onValueChange={(value, ingredient) => {
                          setValue(`ingredients.${index}.ingredientId`, value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                          if (ingredient?.unit) {
                            setValue(
                              `ingredients.${index}.unit`,
                              ingredient.unit,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            )
                          }
                        }}
                      />
                      <FieldError errors={[rowErrors?.ingredientId]} />
                    </Field>

                    <Field data-invalid={!!rowErrors?.quantityPerPortion}>
                      <FieldLabel htmlFor={`qty-${field.id}`}>
                        {t("colQuantity")} *
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`qty-${field.id}`}
                          type="number"
                          min="0"
                          step="0.001"
                          inputMode="decimal"
                          {...register(
                            `ingredients.${index}.quantityPerPortion`
                          )}
                          disabled={isPending}
                        />
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] uppercase"
                        >
                          {unitLabel}
                        </Badge>
                      </div>
                      <FieldError errors={[rowErrors?.quantityPerPortion]} />
                    </Field>

                    <Field data-invalid={!!rowErrors?.yieldPercentage}>
                      <FieldLabel htmlFor={`yield-${field.id}`}>
                        {t("colYield")}
                      </FieldLabel>
                      <Input
                        id={`yield-${field.id}`}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        {...register(`ingredients.${index}.yieldPercentage`)}
                        disabled={isPending}
                      />
                      <FieldError errors={[rowErrors?.yieldPercentage]} />
                    </Field>
                  </div>

                  {row?.ingredientId && (
                    <p className="text-xs text-muted-foreground">
                      {t("grossQuantityHint", {
                        quantity: formatQuantity(gross),
                        unit: unitLabel,
                      })}
                    </p>
                  )}
                </div>
              )
            })}

            {rootError?.message && (
              <p className="text-xs font-medium text-destructive">
                {rootError.message}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ ...EMPTY_ROW })}
              disabled={isPending}
              className="w-full gap-2 rounded-xl"
            >
              <Plus className="size-4" />
              <span>{t("addIngredientRow")}</span>
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
