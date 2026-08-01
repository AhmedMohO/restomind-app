"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useCategoriesList, useDeleteCategory } from "../hooks/use-categories"
import type { ApiCategory } from "../api/type"
import { CategoryDialog } from "./category-dialog"
import { getErrorMessage } from "@/lib/api/utils"

export function CategoryContainer() {
  const t = useTranslations("Dashboard.categories")
  const router = useRouter()

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] =
    React.useState<ApiCategory | null>(null)

  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string
    name: string
  } | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, refetch } = useCategoriesList({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const categories = data?.data ?? []
  const total = data?.totalCount ?? data?.total ?? categories.length
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useDeleteCategory()

  const handleOpenAddDialog = () => {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (category: ApiCategory, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (
    category: ApiCategory,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    setDeleteTarget({
      id: category._id,
      name: category.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(t("deleteSuccess"))
    } catch (err) {
      console.error("[CategoryContainer] Delete failed", err)
      toast.error(getErrorMessage(err, t("deleteError")))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("adminTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminSubtitle")}</p>
        </div>

        <Button
          onClick={handleOpenAddDialog}
          className="w-full gap-2 rounded-xl sm:w-auto"
        >
          <Plus className="size-4" />
          <span>{t("addCategory")}</span>
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-full flex-1 sm:max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-xl ps-9"
          />
        </div>
      </div>

      {/* Table container */}
      <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("fetchError")}</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              Retry
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("noCategories")}</p>
          </div>
        ) : (
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("colCategory")}</TableHead>
                <TableHead className="text-start">
                  {t("colDescription")}
                </TableHead>
                <TableHead className="w-[100px] text-start">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category: ApiCategory) => {
                const isDeletingThis = deletingId === category._id

                return (
                  <TableRow
                    key={category._id}
                    onClick={() =>
                      router.push(`/dashboard/categories/${category._id}`)
                    }
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image?.secure_url ? (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <Image
                              fill
                              src={category.image.secure_url}
                              alt={category.name}
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            {category.name?.[0]?.toUpperCase() ?? "C"}
                          </div>
                        )}
                        <span className="font-semibold text-foreground">
                          {category.name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {category.description || "-"}
                    </TableCell>

                    <TableCell
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex shrink-0 items-center justify-start gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleOpenEditDialog(category, e)}
                          className="size-8 rounded-lg"
                          title={t("editCategory")}
                        >
                          <Edit2 className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeletingThis}
                          onClick={(e) => handleOpenDeleteDialog(category, e)}
                          className="size-8 rounded-lg text-destructive hover:text-destructive"
                          title={t("deleteCategory")}
                        >
                          {isDeletingThis ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination controls */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l)
          setPage(1)
        }}
      />

      {/* Add / Edit Category Dialog */}
      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("deleteConfirmDesc", { name: deleteTarget.name })
            : t("deleteConfirmTitle")
        }
        confirmText={t("deleteBtn")}
        cancelText={t("cancelBtn")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
