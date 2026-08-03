"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  PackageX,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Store,
  Tag,
  Trash2,
  Utensils,
} from "lucide-react"
import Image from "next/image"

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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import { PaginatedCategorySelect } from "@/features/categories/components/paginated-category-select"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { Link, useRouter } from "@/i18n/routing"
import type {
  ApiProduct,
  GetProductsParams,
} from "@/features/products/api/type"
import {
  useChangeProductAvailability,
  useDeleteProduct,
  useProductsList,
} from "@/features/products/hooks/use-products"
import { formatCurrency } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"

function getRefName(
  value: ApiProduct["category"] | ApiProduct["restaurantId"]
) {
  return typeof value === "string" ? "-" : (value?.name ?? "-")
}

export function ProductsContainer() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Dashboard.products")
  const role = useAuthStore((state) => state.user?.role)
  const isAdmin = role === "admin"
  const isStaff = role === "staff"

  const sortOptions = [
    { value: "createdAt", label: t("sortCreatedDate") },
    { value: "title", label: t("sortTitle") },
    { value: "price", label: t("sortPrice") },
    { value: "freshnessWindow", label: t("sortFreshnessWindow") },
  ] as const

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [restaurantId, setRestaurantId] = React.useState("")
  const [tag, setTag] = React.useState("")
  const [sort, setSort] = React.useState("createdAt")
  const [order, setOrder] = React.useState<"asc" | "desc">("desc")
  const [deleteTarget, setDeleteTarget] = React.useState<ApiProduct | null>(
    null
  )
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams: GetProductsParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    category: category || undefined,
    restaurantId: isAdmin && restaurantId ? restaurantId : undefined,
    tag: tag || undefined,
    sort,
    order,
  }

  const { data, isLoading, isError, refetch } = useProductsList(queryParams)
  const deleteMutation = useDeleteProduct()
  const availabilityMutation = useChangeProductAvailability()

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const activeFilterCount = [
    category,
    isAdmin ? restaurantId : "",
    tag,
    sort !== "createdAt" ? sort : "",
    order !== "desc" ? order : "",
  ].filter(Boolean).length

  const isFiltered = activeFilterCount > 0 || Boolean(debouncedSearch)

  const resetFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setCategory("")
    setRestaurantId("")
    setTag("")
    setSort("createdAt")
    setOrder("desc")
    setPage(1)
  }

  const handleHeaderSort = (field: string) => {
    if (sort === field) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSort(field)
      setOrder("asc")
    }
    setPage(1)
  }

  const renderSortIcon = (field: string) => {
    if (sort !== field) {
      return <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
    }
    return order === "asc" ? (
      <ArrowUp className="size-3.5 text-primary" />
    ) : (
      <ArrowDown className="size-3.5 text-primary" />
    )
  }

  const handleAvailabilityChange = async (
    product: ApiProduct,
    isAvailable: boolean
  ) => {
    setUpdatingAvailabilityId(product._id)
    try {
      await availabilityMutation.mutateAsync({ id: product._id, isAvailable })
      toast.success(t("availabilitySuccess"))
    } catch (err) {
      console.error("[ProductsContainer] availability update failed", err)
      toast.error(getErrorMessage(err, t("availabilityError")))
    } finally {
      setUpdatingAvailabilityId(null)
    }
  }

  const handleRowClick = (productId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("[role='switch']")
    ) {
      return
    }
    router.push(`/dashboard/products/${productId}`)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget._id)
      toast.success(t("deleteSuccess"))
      setDeleteTarget(null)
    } catch (err) {
      console.error("[ProductsContainer] delete failed", err)
      toast.error(getErrorMessage(err, t("deleteError")))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Title & Dynamic Active Item Counter */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("adminTitle")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {isFiltered
                ? t("itemsCountFiltered", { showing: products.length, total })
                : t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("adminSubtitle")}</p>
        </div>

        {!isStaff && (
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/products/new" />}
            className="gap-2 rounded-xl"
          >
            <Plus className="size-4" />
            <span>{t("addProduct")}</span>
          </Button>
        )}
      </div>

      {/* Unified Control Bar with adequate margin */}
      <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-full min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="rounded-xl ps-9"
            />
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="size-4" />
                  <span>{t("filters")}</span>
                  {activeFilterCount > 0 && (
                    <Badge className="flex size-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent
              side="right"
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="flex h-full w-full max-w-md flex-col overflow-hidden p-0 sm:max-w-md"
            >
              <SheetHeader className="border-b border-border bg-card/60 p-5 text-start">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Filter className="size-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold">
                      {t("filtersTitle")}
                    </SheetTitle>
                    <SheetDescription>
                      {t("filtersDescription")}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                  <Label
                    htmlFor="product-category-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Utensils className="size-3.5 text-primary" />
                    <span>{t("category")}</span>
                  </Label>
                  <PaginatedCategorySelect
                    id="product-category-filter"
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value)
                      setPage(1)
                    }}
                    placeholder={t("allCategories")}
                  />
                </div>

                <div className="flex flex-wrap gap-4 space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                  <div className="m-0 flex-1">
                    <Label
                      htmlFor="product-sort-filter"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <ArrowUpDown className="size-3.5 text-primary" />
                      <span>{t("sort")}</span>
                    </Label>
                    <Select
                      value={sort}
                      onValueChange={(value) => {
                        setSort(value ?? "createdAt")
                        setPage(1)
                      }}
                    >
                      <SelectTrigger
                        id="product-sort-filter"
                        className="h-9 w-full rounded-xl text-xs"
                      >
                        <SelectValue>
                          {sortOptions.find((opt) => opt.value === sort)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="m-0 flex-1">
                    <Label
                      htmlFor="product-order-filter"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <ArrowUpDown className="size-3.5 text-primary" />
                      <span>{t("order")}</span>
                    </Label>
                    <Select
                      value={order}
                      onValueChange={(value) => {
                        setOrder(value as "asc" | "desc")
                        setPage(1)
                      }}
                    >
                      <SelectTrigger
                        id="product-order-filter"
                        className="w-full rounded-xl text-xs"
                      >
                        <SelectValue>
                          {order === "desc" ? t("descending") : t("ascending")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{t("descending")}</SelectItem>
                        <SelectItem value="asc">{t("ascending")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                    <Label
                      htmlFor="product-restaurant-filter"
                      className="flex items-center gap-2 text-xs font-semibold"
                    >
                      <Store className="size-3.5 text-primary" />
                      <span>{t("restaurant")}</span>
                    </Label>
                    <PaginatedRestaurantSelect
                      id="product-restaurant-filter"
                      value={restaurantId}
                      onValueChange={(value) => {
                        setRestaurantId(value)
                        setPage(1)
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
                  <Label
                    htmlFor="product-tag-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Tag className="size-3.5 text-primary" />
                    <span>{t("tag")}</span>
                  </Label>
                  <Input
                    id="product-tag-filter"
                    value={tag}
                    onChange={(event) => {
                      setTag(event.target.value)
                      setPage(1)
                    }}
                    placeholder={t("tagPlaceholder")}
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>

              <SheetFooter className="border-t border-border bg-card/60 p-5">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full gap-2 rounded-xl"
                >
                  <RotateCcw className="size-4" />
                  <span>{t("resetFilters")}</span>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Table Section with Sticky Header */}
      <div className="max-h-[70vh] w-full min-w-0 overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
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
        ) : products.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageX className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("noProductsMatchFilters")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("filtersDescription")}
              </p>
            </div>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2 gap-2 rounded-xl text-xs"
              >
                <RotateCcw className="size-3.5" />
                <span>{t("clearFilters")}</span>
              </Button>
            )}
          </div>
        ) : (
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-card shadow-xs">
              <TableRow>
                <TableHead className="w-[64px] text-start">
                  {t("colImage")}
                </TableHead>
                {/* Sortable Title Column */}
                <TableHead className="w-[28%] min-w-[180px] text-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderSort("title")}
                    className="-ms-3 h-8 gap-1.5 text-start font-semibold hover:bg-transparent"
                  >
                    <span>{t("colTitleTags")}</span>
                    {renderSortIcon("title")}
                  </Button>
                </TableHead>
                <TableHead className="w-[18%] min-w-[120px] text-start">
                  {t("colCategory")}
                </TableHead>
                <TableHead className="w-[18%] min-w-[140px] text-start">
                  {t("colRestaurant")}
                </TableHead>
                {/* Sortable & End-Aligned Price Column */}
                <TableHead className="w-[12%] min-w-[90px] px-4 text-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderSort("price")}
                    className="ms-auto h-8 gap-1.5 text-end font-semibold hover:bg-transparent"
                  >
                    <span>{t("colPrice")}</span>
                    {renderSortIcon("price")}
                  </Button>
                </TableHead>
                {/* Sortable & End-Aligned Freshness Column */}
                <TableHead className="w-[12%] min-w-[90px] px-4 text-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderSort("freshnessWindow")}
                    className="ms-auto h-8 gap-1.5 text-end font-semibold hover:bg-transparent"
                  >
                    <span>{t("colFreshness")}</span>
                    {renderSortIcon("freshnessWindow")}
                  </Button>
                </TableHead>
                <TableHead className="w-[8%] min-w-[80px] px-4 text-center">
                  {t("colAvailability")}
                </TableHead>
                <TableHead className="w-[60px] text-center">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: ApiProduct) => {
                const visibleTags = product.tags?.slice(0, 2) ?? []
                const extraTags = product.tags?.slice(2) ?? []

                return (
                  <TableRow
                    key={product._id}
                    onClick={(e) => handleRowClick(product._id, e)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="w-[64px]">
                      {product.image?.secure_url ? (
                        <div className="relative size-12 overflow-hidden rounded-xl border border-border bg-muted">
                          <Image
                            fill
                            src={product.image.secure_url}
                            alt={product.title}
                            className="object-cover"
                            loading="lazy"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                          {product.title?.[0]?.toUpperCase() ?? "P"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-[28%] min-w-[180px]">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[220px] truncate font-semibold text-foreground">
                            {product.title}
                          </span>
                          {product.isBestseller && (
                            <Badge className="text-[10px]">
                              {t("bestseller")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex max-w-[260px] flex-wrap items-center gap-1">
                          {visibleTags.length > 0 ? (
                            <>
                              {visibleTags.map((item) => (
                                <Badge
                                  key={item}
                                  variant="outline"
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  {item}
                                </Badge>
                              ))}
                              {extraTags.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger
                                      tabIndex={0}
                                      render={
                                        <Badge
                                          variant="secondary"
                                          className="cursor-pointer px-1.5 py-0 text-[10px] transition-colors hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden"
                                        >
                                          {t("moreTags", {
                                            count: extraTags.length,
                                          })}
                                        </Badge>
                                      }
                                    />
                                    <TooltipContent>
                                      <div className="flex flex-wrap gap-1">
                                        {extraTags.map((item) => (
                                          <span
                                            key={item}
                                            className="text-[10px]"
                                          >
                                            #{item}
                                          </span>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[18%] min-w-[120px] text-sm">
                      {getRefName(product.category)}
                    </TableCell>
                    <TableCell className="w-[18%] min-w-[140px] text-sm">
                      {getRefName(product.restaurantId)}
                    </TableCell>
                    <TableCell className="w-[12%] min-w-[90px] px-4 text-end font-medium">
                      {formatCurrency(product.price, locale)}
                    </TableCell>
                    <TableCell className="w-[12%] min-w-[90px] px-4 text-end text-sm">
                      <span className="inline-flex items-center justify-end gap-1">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {t("hoursSuffix", { count: product.freshnessWindow })}
                      </span>
                    </TableCell>
                    <TableCell className="w-[8%] min-w-[80px] px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Accessibility Comment: Switch uses aria-label for non-hue status state */}
                        <Switch
                          aria-label={t("availableLabel")}
                          checked={product.isAvailable}
                          onCheckedChange={(checked) =>
                            handleAvailabilityChange(product, checked)
                          }
                          disabled={updatingAvailabilityId === product._id}
                        />
                        {updatingAvailabilityId === product._id && (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        )}
                      </div>
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
                          <DropdownMenuItem
                            render={
                              <Link
                                href={`/dashboard/products/${product._id}`}
                              />
                            }
                          >
                            <Eye className="size-4" />
                            <span>{t("viewDetails")}</span>
                          </DropdownMenuItem>
                          {!isStaff && (
                            <DropdownMenuItem
                              render={
                                <Link
                                  href={`/dashboard/products/${product._id}/edit`}
                                />
                              }
                            >
                              <Pencil className="size-4" />
                              <span>{t("edit")}</span>
                            </DropdownMenuItem>
                          )}
                          {!isStaff && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(product)}
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
        )}
      </div>

      {/* Pagination Footer */}
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={t("deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("deleteConfirmDesc", { title: deleteTarget.title })
            : ""
        }
        confirmText={t("delete")}
        cancelText={t("cancel")}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
