"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { User as UserIcon } from "lucide-react"

import {
  PaginatedSelect,
  type PaginatedSelectFetchParams,
  type PaginatedSelectOption,
} from "@/components/ui/paginated-select"
import { clientFetch } from "@/lib/api/fetch-client"
import type { ApiUser } from "../api"

interface PaginatedUserSelectProps {
  value?: string
  onValueChange: (value: string, user?: ApiUser) => void
  disabled?: boolean
  placeholder?: string
  role?: string
  className?: string
}

export function PaginatedUserSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder,
  role = "manager",
  className,
}: PaginatedUserSelectProps) {
  const t = useTranslations("Dashboard.restaurant")

  const fetchUsers = async ({
    page,
    limit,
    search,
  }: PaginatedSelectFetchParams) => {
    const searchParams = new URLSearchParams()
    if (page) searchParams.set("page", String(page))
    if (limit) searchParams.set("limit", String(limit))
    if (search) searchParams.set("search", search)
    if (role && role !== "all") searchParams.set("role", role)

    const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
    const res = await clientFetch<unknown>(`/users${qs}`)

    let items: ApiUser[] = []
    let totalPages = 1

    if (res) {
      if (Array.isArray(res)) {
        items = res as ApiUser[]
      } else {
        const obj = res as Record<string, unknown>
        if (Array.isArray(obj.items)) {
          items = obj.items as ApiUser[]
          totalPages = Number(obj.totalPages ?? 1)
        } else if (obj.data) {
          if (Array.isArray(obj.data)) {
            items = obj.data as ApiUser[]
          } else {
            const dataObj = obj.data as Record<string, unknown>
            if (Array.isArray(dataObj.items)) {
              items = dataObj.items as ApiUser[]
              totalPages = Number(dataObj.totalPages ?? 1)
            }
          }
        }
      }
    }

    // Exclude customer role when selecting owners
    if (role && role !== "all") {
      items = items.filter((user) => user.role !== "customer")
    }

    const options: PaginatedSelectOption<ApiUser>[] = items.map((user) => ({
      value: user._id,
      label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      subLabel: user.email,
      badge: user.role,
      icon: <UserIcon className="size-3.5" />,
      data: user,
    }))

    return {
      items: options,
      totalPages,
    }
  }

  return (
    <PaginatedSelect<ApiUser>
      value={value}
      onValueChange={(val, option) => onValueChange(val, option?.data)}
      fetchData={fetchUsers}
      queryKey={["users-select", role ?? "all"]}
      placeholder={placeholder ?? t("selectOwnerPlaceholder")}
      searchPlaceholder={t("searchPlaceholder")}
      disabled={disabled}
      className={className}
    />
  )
}
