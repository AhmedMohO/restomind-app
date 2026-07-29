"use client"

import { useTranslations } from "next-intl"
import { Pagination } from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TablePaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  className?: string
}

export function TablePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  className,
}: TablePaginationProps) {
  const t = useTranslations("Dashboard.pagination")

  if (total <= 0) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <span className="text-center text-xs text-muted-foreground sm:text-start">
        {t("pageOf", { page, totalPages })}
      </span>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t("rowsPerPage")}</span>
          <Select
            value={String(limit)}
            onValueChange={(val) => {
              if (val) onLimitChange(Number(val))
            }}
          >
            <SelectTrigger className="h-8 w-[70px] rounded-lg text-xs">
              <SelectValue placeholder={String(limit)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
