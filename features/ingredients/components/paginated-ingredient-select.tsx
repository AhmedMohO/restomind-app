"use client"

import { Carrot } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiIngredient,
  PaginatedIngredients,
} from "@/features/ingredients/api/type"
import { useIngredientById } from "@/features/ingredients/hooks/use-ingredients"

interface PaginatedIngredientSelectProps {
  value?: string
  onValueChange: (value: string, ingredient?: ApiIngredient) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Ingredient ids already used elsewhere in the form — hidden from the list. */
  excludeIds?: string[]
}

/**
 * Ingredient picker backed by the paginated `/ingredients` endpoint.
 *
 * The currently-selected ingredient is fetched separately and prepended when
 * it falls outside the active page or search, so an edit form never shows an
 * empty trigger for a valid selection.
 */
export function PaginatedIngredientSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder,
  className,
  excludeIds = [],
}: PaginatedIngredientSelectProps) {
  const t = useTranslations("Dashboard.ingredients")
  const { data: selectedIngredient } = useIngredientById(value || null)

  const toOption = (
    ingredient: ApiIngredient
  ): PaginatedSelectOption<ApiIngredient> => ({
    value: ingredient._id,
    label: ingredient.name,
    subLabel: ingredient.ingredientCode,
    badge: t(`unit_${ingredient.unit}`),
    icon: <Carrot className="size-3.5" />,
    data: ingredient,
  })

  const fetchIngredients = async ({
    page,
    limit,
    search,
  }: PaginatedSelectFetchParams) => {
    const qs = buildQueryString({ page, limit, search: search || undefined })
    const res = await clientFetch<PaginatedIngredients>(`/ingredients${qs}`)

    const items = res?.items ?? []
    // Never offer an ingredient that is already a row in the recipe, but keep
    // the row's own current selection visible.
    const excluded = new Set(excludeIds.filter((id) => id !== value))
    const options = items
      .filter((ingredient) => !excluded.has(ingredient._id))
      .map(toOption)

    if (
      selectedIngredient &&
      !options.some((option) => option.value === selectedIngredient._id)
    ) {
      options.unshift(toOption(selectedIngredient))
    }

    return {
      items: options,
      totalPages: Math.max(1, Number(res?.totalPages ?? 1)),
      total: Number(res?.total ?? options.length),
    }
  }

  return (
    <PaginatedSelect<ApiIngredient>
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchIngredients}
      queryKey={["ingredients-select", value ?? "", excludeIds.join(",")]}
      placeholder={placeholder ?? t("selectIngredient")}
      searchPlaceholder={t("searchPlaceholder")}
      disabled={disabled}
      className={className}
      limit={6}
    />
  )
}
