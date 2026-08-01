"use client"

import * as React from "react"
import { FolderTree } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import type {
  ApiCategory,
  PaginatedCategories,
} from "@/features/categories/api/type"
import { useCategoryById } from "@/features/categories/hooks/use-categories"

interface PaginatedCategorySelectProps {
  id?: string
  value?: string
  onValueChange: (value: string, category?: ApiCategory) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  className?: string
}

export function PaginatedCategorySelect({
  id,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  searchPlaceholder,
  className,
}: PaginatedCategorySelectProps) {
  const t = useTranslations("Dashboard.products")
  const { data: singleCategory } = useCategoryById(value ?? "")

  const normalizeCategoriesResponse = (
    res: PaginatedCategories | ApiCategory[] | undefined
  ): { categories: ApiCategory[]; totalPages: number; total: number } => {
    if (!res) return { categories: [], totalPages: 1, total: 0 }
    if (Array.isArray(res)) {
      return { categories: res, totalPages: 1, total: res.length }
    }
    const categories = Array.isArray(res.data) ? res.data : []
    return {
      categories,
      totalPages: Number(res.totalPages ?? 1),
      total: Number(res.total ?? res.totalCount ?? categories.length),
    }
  }

  const fetchCategories = async ({
    page,
    limit,
    search,
  }: PaginatedSelectFetchParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set("page", String(page))
    searchParams.set("limit", String(limit))
    if (search) searchParams.set("search", search)

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await clientFetch<PaginatedCategories | ApiCategory[]>(
      `/categories${qs}`
    )

    const { categories, totalPages, total } = normalizeCategoriesResponse(res)
    const options: PaginatedSelectOption<ApiCategory>[] = categories.map(
      (cat) => ({
        value: cat._id,
        label: cat.name,
        subLabel: cat.description || undefined,
        icon: <FolderTree className="size-3.5" />,
        data: cat,
      })
    )

    if (
      value &&
      singleCategory &&
      !options.some((opt) => opt.value === value)
    ) {
      options.unshift({
        value: singleCategory._id,
        label: singleCategory.name,
        subLabel: singleCategory.description || undefined,
        icon: <FolderTree className="size-3.5" />,
        data: singleCategory,
      })
    }

    return {
      items: options,
      totalPages,
      total,
    }
  }

  return (
    <PaginatedSelect<ApiCategory>
      id={id}
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchCategories}
      queryKey={["categories-select", value ?? ""]}
      placeholder={placeholder ?? t("selectCategoryPlaceholder")}
      searchPlaceholder={searchPlaceholder ?? t("allCategories")}
      disabled={disabled}
      className={className}
      limit={6}
    />
  )
}
