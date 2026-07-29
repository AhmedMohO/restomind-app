"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react"
import Image from "next/image"
import { Link, useRouter } from "@/i18n/routing"

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
import {
  useDeleteRestaurant,
  useRestaurantsList,
} from "../hooks/use-restaurant"
import type { Restaurant } from "../types"
import { RestaurantStatusBadge } from "./restaurant-status-badge"
import { formatOwner } from "../utils/utils"
import { getErrorMessage } from "@/lib/api/utils"

export function AdminRestaurantTable() {
  const t = useTranslations("Dashboard.restaurant")
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

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

  const { data, isLoading, isError, refetch } = useRestaurantsList({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useDeleteRestaurant()

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(t("deleteSuccess"))
    } catch (err) {
      console.error("[AdminRestaurantTable] delete failed", err)
      toast.error(getErrorMessage(err, t("deleteError")))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("adminTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminSubtitle")}</p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/restaurants/new" />}
          className="w-full gap-2 rounded-xl sm:w-auto"
        >
          <Plus className="size-4" />
          <span>{t("createRestaurant")}</span>
        </Button>
      </div>

      {/* Filter and search bar */}
      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-full flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
              {t("retry")}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("noRestaurants")}
            </p>
          </div>
        ) : (
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">
                  {t("colRestaurant")}
                </TableHead>
                <TableHead className="text-start">{t("colOwner")}</TableHead>
                <TableHead className="text-start">{t("colLocation")}</TableHead>
                <TableHead className="text-start">{t("colStatus")}</TableHead>
                <TableHead className="text-start">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((restaurant: Restaurant) => {
                const logoSrc = restaurant.image?.secure_url
                return (
                  <TableRow
                    onClick={() =>
                      router.push(`/dashboard/restaurants/${restaurant._id}`)
                    }
                    className="cursor-pointer"
                    key={restaurant._id}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {logoSrc ? (
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border">
                            <Image
                              fill
                              src={logoSrc}
                              alt={restaurant.name}
                              className="object-cover"
                              sizes="36px"
                            />
                          </div>
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {restaurant.name?.[0]?.toUpperCase() ?? "R"}
                          </div>
                        )}
                      <div className="flex min-w-0 flex-col">
                        <span className="max-w-[160px] truncate font-semibold text-foreground sm:max-w-xs">
                          {restaurant.name}
                        </span>
                        {restaurant.phone && (
                          <span
                            dir="ltr"
                            className="w-min text-start text-xs text-muted-foreground"
                          >
                            {restaurant.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell
                    className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-[200px]"
                    title={formatOwner(restaurant.ownerUserId)}
                  >
                    {formatOwner(restaurant.ownerUserId)}
                  </TableCell>

                  <TableCell className="max-w-[120px] truncate text-xs sm:max-w-[180px]">
                    {restaurant.address?.city && restaurant.address?.country
                      ? `${restaurant.address?.city ?? ""}, ${restaurant.address?.country ?? ""}`
                      : "—"}
                  </TableCell>

                  <TableCell className="shrink-0">
                    <RestaurantStatusBadge isActive={restaurant.isActive} />
                  </TableCell>

                  <TableCell className="shrink-0">
                    <div className="flex shrink-0 items-center justify-start gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(
                            `/dashboard/restaurants/${restaurant._id}/edit`
                          )
                        }}
                        className="size-8 rounded-lg"
                        title="Edit Restaurant"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({
                            id: restaurant._id,
                            name: restaurant.name,
                          })
                        }}
                        disabled={deletingId === restaurant._id}
                        className="size-8 rounded-lg text-destructive hover:text-destructive"
                        title="Delete Restaurant"
                      >
                        {deletingId === restaurant._id ? (
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

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={t("deleteRestaurant")}
        description={
          deleteTarget
            ? `${t("deleteConfirmDesc")} ("${deleteTarget.name}")`
            : t("deleteConfirmDesc")
        }
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        isLoading={!!deletingId}
      />
    </div>
  )
}
