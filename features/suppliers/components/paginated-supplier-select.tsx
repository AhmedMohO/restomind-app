"use client"

import { Truck } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import type { ApiSupplier, PaginatedSuppliers } from "../types"

interface PaginatedSupplierSelectProps {
  value?: string
  onValueChange: (value: string, supplier?: ApiSupplier) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  allowAllOption?: boolean
  allOptionLabel?: string
}

export function PaginatedSupplierSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder,
  className,
  allowAllOption = false,
  allOptionLabel,
}: PaginatedSupplierSelectProps) {
  const t = useTranslations("Dashboard.purchaseOrders")

  const toOption = (supplier: ApiSupplier): PaginatedSelectOption<ApiSupplier> => ({
    value: supplier._id,
    label: supplier.name,
    subLabel: supplier.phone || supplier.email,
    icon: <Truck className="size-3.5" />,
    data: supplier,
  })

  const fetchSuppliers = async ({
    page,
    limit,
    search,
  }: PaginatedSelectFetchParams) => {
    const qs = buildQueryString({ page, limit, search: search || undefined })
    const res = await clientFetch<PaginatedSuppliers>(`/suppliers${qs}`)
    const items = res?.items ?? []
    const options = items.map(toOption)

    if (allowAllOption) {
      options.unshift({
        value: "",
        label: allOptionLabel ?? t("allSuppliers"),
      })
    }

    return {
      items: options,
      totalPages: Math.max(1, Number(res?.totalPages ?? 1)),
      total: Number(res?.total ?? options.length),
    }
  }

  return (
    <PaginatedSelect<ApiSupplier>
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchSuppliers}
      queryKey={["suppliers-select", value ?? "", String(allowAllOption)]}
      placeholder={placeholder ?? t("selectSupplier")}
      searchPlaceholder={t("searchSupplierPlaceholder")}
      disabled={disabled}
      className={className}
      limit={8}
    />
  )
}
