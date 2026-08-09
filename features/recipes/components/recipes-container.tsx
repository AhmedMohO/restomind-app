"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ChefHat, PackageX, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { SortableHeader, TableState } from "@/components/ui/table-state"
import { Link } from "@/i18n/routing"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useTableControls } from "@/hooks/use-table-controls"
import { formatCurrency, getImageUrl } from "@/lib/utils"
import type { ApiProduct } from "@/features/products/api/type"
import { useProductsList } from "@/features/products/hooks/use-products"

function getCategoryName(value: ApiProduct["category"]): string {
  return typeof value === "string" ? "—" : (value?.name ?? "—")
}

/**
 * Recipe management entry point.
 *
 * Recipes are keyed by product, so this lists the manager's products (the
 * `/products` endpoint scopes managers to their own restaurant automatically)
 * and links each one to its recipe editor.
 */
export function RecipesContainer() {
  const t = useTranslations("Dashboard.recipes")
  const locale = useLocale()

  const { page, setPage, resetPage, limit, setLimit, sort, order, toggleSort } =
    useTableControls({ initialSort: "createdAt", initialOrder: "desc" })

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const { data, isLoading, isError, refetch } = useProductsList({
    page,
    limit,
    search: debouncedSearch || undefined,
    sort,
    order,
  })

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const isFiltered = Boolean(debouncedSearch)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("title")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {isFiltered
                ? t("itemsCountFiltered", { showing: products.length, total })
                : t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          render={<Link href="/dashboard/recipes/new" />}
          nativeButton={false}
          className="gap-2 self-start rounded-xl sm:self-auto"
        >
          <Plus className="size-4" />
          <span>{t("addRecipe")}</span>
        </Button>
      </div>

      <div className="relative max-w-full min-w-[200px] sm:max-w-xs">
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

      <div className="max-h-[70vh] w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={products.length === 0}
          onRetry={() => refetch()}
          errorText={t("productsFetchError")}
          retryText={t("retry")}
          emptyIcon={PackageX}
          emptyTitle={isFiltered ? t("noMatches") : t("emptyTitle")}
          emptyDescription={
            isFiltered ? t("noMatchesDesc") : t("emptyDescription")
          }
          onClearFilters={isFiltered ? () => handleSearchChange("") : undefined}
          clearFiltersText={t("clearSearch")}
        >
          <Table className="min-w-[760px] sm:min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
              <TableRow>
                <TableHead className="w-[64px] text-start">
                  {t("colImage")}
                </TableHead>
                <TableHead className="w-[34%] min-w-[200px] text-start">
                  <SortableHeader
                    field="title"
                    activeField={sort ?? ""}
                    order={order}
                    onSort={toggleSort}
                  >
                    {t("colProduct")}
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[22%] min-w-[140px] text-start">
                  {t("colCategory")}
                </TableHead>
                <TableHead className="w-[16%] min-w-[100px] px-4 text-end">
                  <SortableHeader
                    field="price"
                    activeField={sort ?? ""}
                    order={order}
                    onSort={toggleSort}
                    align="end"
                  >
                    {t("colPrice")}
                  </SortableHeader>
                </TableHead>
                <TableHead className="w-[160px] text-end">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: ApiProduct) => (
                <TableRow
                  key={product._id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="w-[64px]">
                    <div className="relative size-12 overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        fill
                        src={getImageUrl(product.image?.secure_url)}
                        alt={product.title}
                        className="object-cover"
                        loading="lazy"
                        sizes="48px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <span className="block max-w-[260px] truncate">
                      {product.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {getCategoryName(product.category)}
                  </TableCell>
                  <TableCell className="px-4 text-end font-medium">
                    {formatCurrency(product.price, locale)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link href={`/dashboard/recipes/${product._id}`} />
                      }
                      nativeButton={false}
                      className="gap-2 rounded-xl text-xs"
                    >
                      <ChefHat className="size-3.5" />
                      <span>{t("manageRecipe")}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  )
}
