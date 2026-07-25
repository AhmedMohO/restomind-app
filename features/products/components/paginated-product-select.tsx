"use client"

import { Package } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type {
  ApiProduct,
  PaginatedProducts,
} from "@/features/products/api/type"
import { useProductById } from "@/features/products/hooks/use-products"

interface PaginatedProductSelectProps {
  value?: string
  onValueChange: (value: string, product?: ApiProduct) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Narrows the list to one restaurant (admin views); managers are auto-scoped. */
  restaurantId?: string
}

/**
 * Product picker backed by the paginated `/products` endpoint. The selected
 * product is fetched separately so the trigger keeps its label even when the
 * selection is not on the current page.
 */
export function PaginatedProductSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder,
  className,
  restaurantId,
}: PaginatedProductSelectProps) {
  const t = useTranslations("Dashboard.products")
  const { data: selectedProduct } = useProductById(value || null)

  const toOption = (
    product: ApiProduct
  ): PaginatedSelectOption<ApiProduct> => ({
    value: product._id,
    label: product.title,
    subLabel:
      typeof product.category === "string"
        ? undefined
        : product.category?.name,
    icon: <Package className="size-3.5" />,
    data: product,
  })

  const fetchProducts = async ({
    page,
    limit,
    search,
  }: PaginatedSelectFetchParams) => {
    const qs = buildQueryString({
      page,
      limit,
      search: search || undefined,
      restaurantId: restaurantId || undefined,
    })
    const res = await clientFetch<PaginatedProducts>(`/products${qs}`)

    const options = (res?.items ?? []).map(toOption)

    if (
      selectedProduct &&
      !options.some((option) => option.value === selectedProduct._id)
    ) {
      options.unshift(toOption(selectedProduct))
    }

    return {
      items: options,
      totalPages: Math.max(1, Number(res?.totalPages ?? 1)),
      total: Number(res?.total ?? options.length),
    }
  }

  return (
    <PaginatedSelect<ApiProduct>
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchProducts}
      queryKey={["products-select", value ?? "", restaurantId ?? ""]}
      placeholder={placeholder ?? t("productDetails")}
      searchPlaceholder={t("searchPlaceholder")}
      disabled={disabled}
      className={className}
      limit={6}
    />
  )
}
