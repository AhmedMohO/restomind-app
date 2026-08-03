"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  CalendarClock,
  Carrot,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/table-pagination"
import { TableState } from "@/components/ui/table-state"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useTableControls } from "@/hooks/use-table-controls"
import { getErrorMessage } from "@/lib/api/utils"
import type { ApiIngredient } from "@/features/ingredients/api/type"
import {
  useDeleteIngredient,
  useIngredientsList,
} from "@/features/ingredients/hooks/use-ingredients"
import { IngredientFormDialog } from "./ingredient-form-dialog"
import { useAuthStore } from "@/features/auth/store/useAuthStore"

/** Formats a stock threshold; 0 means "no threshold configured". */
function formatThreshold(value: number | undefined, unitLabel: string): string {
  if (!value || value <= 0) return "—"
  return `${value} ${unitLabel}`
}

export function IngredientsContainer() {
  const t = useTranslations("Dashboard.ingredients")
  const isStaff = useAuthStore((s) => s.user?.role === "staff")

  const { page, setPage, resetPage, limit, setLimit } = useTableControls()

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search)

  const [formTarget, setFormTarget] = React.useState<ApiIngredient | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ApiIngredient | null>(
    null
  )

  // A new search term always restarts pagination, otherwise page 4 of the old
  // result set would be requested against a much smaller filtered set.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const { data, isLoading, isError, refetch } = useIngredientsList({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const ingredients = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const isFiltered = Boolean(debouncedSearch)

  const openCreate = () => {
    setFormTarget(null)
    setIsFormOpen(true)
  }

  const openEdit = (ingredient: ApiIngredient) => {
    setFormTarget(ingredient)
    setIsFormOpen(true)
  }

  const deleteMutation = useDeleteIngredient()

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget._id)
      toast.success(t("deleteSuccess"))
      // Removing the only row on a trailing page would leave the user staring
      // at an empty table — step back a page as part of the same interaction.
      if (ingredients.length === 1 && page > 1) {
        setPage(page - 1)
      }
      setDeleteTarget(null)
    } catch (err) {
      console.error("[IngredientsContainer] delete failed", err)
      // The backend rejects deletion (400) while the ingredient is still
      // referenced by an active recipe — show that reason verbatim.
      toast.error(getErrorMessage(err, t("deleteError")))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("title")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {isFiltered
                ? t("itemsCountFiltered", {
                    showing: ingredients.length,
                    total,
                  })
                : t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-full min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="rounded-xl px-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label={t("clearSearch")}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {!isStaff && (
          <Button onClick={openCreate} className="shrink-0 gap-2 rounded-xl">
            <Plus className="size-4" />
            <span>{t("addIngredient")}</span>
          </Button>
        )}
      </div>

      <div className="max-h-[70vh] w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={ingredients.length === 0}
          onRetry={() => refetch()}
          errorText={t("fetchError")}
          retryText={t("retry")}
          emptyIcon={Carrot}
          emptyTitle={isFiltered ? t("noMatches") : t("emptyTitle")}
          emptyDescription={
            isFiltered ? t("noMatchesDesc") : t("emptyDescription")
          }
          onClearFilters={isFiltered ? () => handleSearchChange("") : undefined}
          clearFiltersText={t("clearSearch")}
        >
          <Table className="min-w-[860px] sm:min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
              <TableRow>
                <TableHead className="w-[16%] min-w-[120px] text-start">
                  {t("colCode")}
                </TableHead>
                <TableHead className="w-[28%] min-w-[180px] text-start">
                  {t("colName")}
                </TableHead>
                <TableHead className="w-[12%] min-w-[90px] text-start">
                  {t("colUnit")}
                </TableHead>
                <TableHead className="w-[14%] min-w-[110px] px-4 text-end">
                  {t("colShelfLife")}
                </TableHead>
                <TableHead className="w-[14%] min-w-[110px] px-4 text-end">
                  {t("colMinimumStock")}
                </TableHead>
                <TableHead className="w-[14%] min-w-[110px] px-4 text-end">
                  {t("colSafetyStock")}
                </TableHead>
                <TableHead className="w-[60px] text-center">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient: ApiIngredient) => {
                const unitLabel = t(`unit_${ingredient.unit}`)

                return (
                  <TableRow
                    key={ingredient._id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <span className="rounded-lg bg-muted/60 px-2 py-1 font-mono text-xs text-foreground">
                        {ingredient.ingredientCode}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <span className="block max-w-[240px] truncate">
                        {ingredient.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {unitLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-end text-sm">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <CalendarClock className="size-3.5 text-muted-foreground" />
                        {t("daysSuffix", { count: ingredient.shelfLifeDays })}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-end text-sm">
                      {formatThreshold(ingredient.minimumStock, unitLabel)}
                    </TableCell>
                    <TableCell className="px-4 text-end text-sm">
                      {formatThreshold(ingredient.safetyStock, unitLabel)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg"
                              aria-label={t("colActions")}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-40">
                          {!isStaff && (
                            <DropdownMenuItem
                              onClick={() => openEdit(ingredient)}
                            >
                              <Pencil className="size-4" />
                              <span>{t("edit")}</span>
                            </DropdownMenuItem>
                          )}
                          {!isStaff && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(ingredient)}
                            >
                              <Trash2 className="size-4" />
                              <span>{t("delete")}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableState>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <IngredientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        ingredient={formTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={t("deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("deleteConfirmDesc", { name: deleteTarget.name })
            : ""
        }
        confirmText={t("delete")}
        cancelText={t("cancel")}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
