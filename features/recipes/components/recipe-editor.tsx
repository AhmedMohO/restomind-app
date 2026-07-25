"use client"

import * as React from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ChefHat,
  Loader2,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/routing"
import { getErrorMessage } from "@/lib/api/utils"
import { formatDate } from "@/lib/utils"
import { useZodResolver } from "@/lib/zod-locale"
import { recipeFormSchema, type RecipeFormInput } from "@/schemas/recipe"
import { PaginatedIngredientSelect } from "@/features/ingredients/components/paginated-ingredient-select"
import type { IngredientUnit } from "@/features/ingredients/api/type"
import { useProductById } from "@/features/products/hooks/use-products"
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

interface RecipeEditorProps {
  productId: string
}

export function RecipeEditor({ productId }: RecipeEditorProps) {
  const t = useTranslations("Dashboard.recipes")
  const tIngredients = useTranslations("Dashboard.ingredients")
  const locale = useLocale()

  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useProductById(productId)

  const {
    data: recipe,
    isLoading: isRecipeLoading,
    isError: isRecipeError,
    refetch: refetchRecipe,
  } = useProductRecipe(productId)

  const upsertMutation = useUpsertProductRecipe()

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<RecipeFormInput>({
    resolver: useZodResolver(recipeFormSchema),
    defaultValues: { ingredients: [EMPTY_ROW] },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  })

  // Seed the form once the saved recipe arrives. The ingredient's own unit wins
  // over the stored line unit — the backend rejects any mismatch on save.
  React.useEffect(() => {
    if (isRecipeLoading) return

    const rows = (recipe?.ingredients ?? [])
      .map((line: ApiRecipeIngredient) => {
        const ingredient = getRecipeIngredient(line.ingredientId)
        return {
          ingredientId: getRecipeIngredientId(line.ingredientId),
          quantityPerPortion: line.quantityPerPortion,
          unit: (ingredient?.unit ?? line.unit) as IngredientUnit,
          yieldPercentage: line.yieldPercentage ?? 100,
        }
      })
      .filter((row: ApiRecipeIngredient) => row.ingredientId)

    reset({ ingredients: rows.length > 0 ? rows : [EMPTY_ROW] })
  }, [recipe, isRecipeLoading, reset])

  const watchedRows = useWatch({ control, name: "ingredients" })

  const selectedIds = React.useMemo(
    () =>
      (watchedRows ?? [])
        .map((row) => row?.ingredientId)
        .filter(Boolean) as string[],
    [watchedRows]
  )

  const isPending = upsertMutation.isPending
  const hasRecipe = Boolean(recipe)

  const onSubmit = handleSubmit(async (values) => {
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
      toast.success(hasRecipe ? t("updateSuccess") : t("createSuccess"))
    } catch (err) {
      console.error("[RecipeEditor] save failed", err)
      toast.error(getErrorMessage(err, t("saveError")))
    }
  })

  if (isProductLoading || isRecipeLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-7 w-56 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    )
  }

  // A missing recipe is not an error (the editor opens empty); a failed product
  // lookup or a non-404 recipe failure is.
  if (isProductError || !product || isRecipeError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <TriangleAlert className="size-6" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {isProductError || !product
            ? t("productFetchError")
            : t("fetchError")}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              refetchProduct()
              refetchRecipe()
            }}
            className="rounded-xl"
          >
            {t("retry")}
          </Button>
          <Button
            render={<Link href="/dashboard/recipes" />}
            className="rounded-xl"
          >
            {t("backToList")}
          </Button>
        </div>
      </div>
    )
  }

  const rootError = errors.ingredients?.root ?? errors.ingredients

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <BackButton href="/dashboard/recipes" aria-label={t("backToList")} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {product.title}
              </h1>
              <Badge
                variant={hasRecipe ? "default" : "outline"}
                className="rounded-full px-2.5 py-0.5 text-xs"
              >
                {hasRecipe ? t("statusDefined") : t("statusMissing")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasRecipe && recipe?.updatedAt
                ? t("lastUpdated", {
                    date: formatDate(recipe.updatedAt, locale),
                  })
                : t("editorSubtitle")}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <Button
            type="submit"
            form="recipe-form"
            disabled={isPending || !isDirty}
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

      <form id="recipe-form" onSubmit={onSubmit} noValidate>
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
                      // The backend requires at least one line; keep one row.
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
                        excludeIds={selectedIds}
                        disabled={isPending}
                        onValueChange={(value, ingredient) => {
                          setValue(`ingredients.${index}.ingredientId`, value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                          // The unit always mirrors the chosen ingredient —
                          // any other value is rejected upstream.
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
