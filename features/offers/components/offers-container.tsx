"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Calendar,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
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
import { TablePagination } from "@/components/ui/table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PaginatedCategorySelect } from "@/features/categories/components/paginated-category-select"
import { Link, useRouter } from "@/i18n/routing"
import type { ApiOffer, GetOffersParams } from "@/features/offers/api/type"
import {
  useCancelOffer,
  useOffersList,
} from "@/features/offers/hooks/use-offers"
import type {
  OfferSource,
  OfferStatus,
  SortField,
  SortOrder,
} from "@/features/offers/types"
import {
  computeSoldUnits,
  getOfferStatusLabel,
  getStatusBadgeVariant,
} from "@/features/offers/utils"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"

export function OffersContainer() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Dashboard.offers")

  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<OfferStatus | "all">("all")
  const [source, setSource] = React.useState<OfferSource | "all">("all")
  const [category, setCategory] = React.useState("")
  const [sort, setSort] = React.useState<SortField>("createdAt")
  const [order, setOrder] = React.useState<SortOrder>("desc")
  const [cancelTarget, setCancelTarget] = React.useState<ApiOffer | null>(null)

  const sortOptions = React.useMemo(
    () =>
      [
        { value: "createdAt" as SortField, label: t("sortCreatedAt") },
        { value: "offerPrice" as SortField, label: t("sortOfferPrice") },
        {
          value: "discountPercentage" as SortField,
          label: t("sortDiscountPercentage"),
        },
        { value: "startDate" as SortField, label: t("sortStartDate") },
        { value: "endDate" as SortField, label: t("sortEndDate") },
      ] as const,
    [t]
  )

  const statusOptions = React.useMemo(
    () =>
      [
        { value: "all" as const, label: t("allStatuses") },
        { value: "active" as OfferStatus, label: t("statusActive") },
        { value: "scheduled" as OfferStatus, label: t("statusScheduled") },
        { value: "draft" as OfferStatus, label: t("statusDraft") },
        { value: "sold_out" as OfferStatus, label: t("statusSoldOut") },
        { value: "expired" as OfferStatus, label: t("statusExpired") },
        { value: "cancelled" as OfferStatus, label: t("statusCancelled") },
      ] as const,
    [t]
  )

  const sourceOptions = React.useMemo(
    () =>
      [
        { value: "all" as const, label: t("allSources") },
        { value: "manual" as OfferSource, label: t("sourceManual") },
        {
          value: "ai_recommendation" as OfferSource,
          label: t("sourceAiRecommendation"),
        },
      ] as const,
    [t]
  )

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const queryParams: GetOffersParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    source: source !== "all" ? source : undefined,
    categoryId: category || undefined,
    sortBy: sort,
    sortOrder: order,
  }

  const { data, isLoading, isError, refetch } = useOffersList(queryParams)
  const cancelMutation = useCancelOffer()

  const offers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const activeFilterCount = [
    status !== "all" ? status : "",
    source !== "all" ? source : "",
    category,
    sort !== "createdAt" ? sort : "",
    order !== "desc" ? order : "",
  ].filter(Boolean).length

  const isFiltered = activeFilterCount > 0 || Boolean(debouncedSearch)

  const resetFilters = React.useCallback(() => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("all")
    setSource("all")
    setCategory("")
    setSort("createdAt")
    setOrder("desc")
    setPage(1)
  }, [])

  const handleHeaderSort = React.useCallback(
    (field: SortField) => {
      if (sort === field) {
        setOrder((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSort(field)
        setOrder("asc")
      }
      setPage(1)
    },
    [sort]
  )

  const handleRowClick = React.useCallback(
    (offerId: string, e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest("[role='switch']")
      ) {
        return
      }
      router.push(`/dashboard/offers/${offerId}`)
    },
    [router]
  )

  const handleCancelConfirm = React.useCallback(async () => {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync(cancelTarget._id)
      toast.success(t("cancelSuccess"))
      setCancelTarget(null)
    } catch (err) {
      console.error("[OffersContainer] Cancel offer failed", err)
      toast.error(getErrorMessage(err, t("cancelError")))
    }
  }, [cancelTarget, cancelMutation, t])

  const renderSortIcon = (field: SortField) => {
    if (sort !== field)
      return <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
    return order === "asc" ? (
      <ArrowUp className="size-3.5 text-primary" />
    ) : (
      <ArrowDown className="size-3.5 text-primary" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 font-heading text-2xl font-bold tracking-tight">
            <span>{t("title")}</span>
            <span className="text-lg font-normal text-muted-foreground">
              {isFiltered
                ? t("itemsCountFiltered", { showing: offers.length, total })
                : t("itemsCount", { count: total })}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/offers/new" />}
          className="gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          <span>{t("addOffer")}</span>
        </Button>
      </div>

      {/* Control Bar */}
      <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-full min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                {/* Status Filter */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4">
                  <Label
                    htmlFor="offer-status-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Tag className="size-3.5 text-primary" />
                    <span>{t("status")}</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val ?? "all")
                      setPage(1)
                    }}
                  >
                    <SelectTrigger
                      id="offer-status-filter"
                      className="h-9 w-full rounded-xl text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source Filter */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4">
                  <Label
                    htmlFor="offer-source-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    <span>{t("source")}</span>
                  </Label>
                  <Select
                    value={source}
                    onValueChange={(val) => {
                      setSource(val ?? "all")
                      setPage(1)
                    }}
                  >
                    <SelectTrigger
                      id="offer-source-filter"
                      className="h-9 w-full rounded-xl text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4">
                  <Label
                    htmlFor="offer-category-filter"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Utensils className="size-3.5 text-primary" />
                    <span>{t("product")}</span>
                  </Label>
                  <PaginatedCategorySelect
                    id="offer-category-filter"
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value)
                      setPage(1)
                    }}
                    placeholder={t("allProducts")}
                  />
                </div>

                {/* Sorting */}
                <div className="flex flex-wrap gap-4 space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                  <div className="m-0 flex-1">
                    <Label
                      htmlFor="offer-sort-filter"
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
                        id="offer-sort-filter"
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
                      htmlFor="offer-order-filter"
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <ArrowUpDown className="size-3.5 text-primary" />
                      <span>{t("order")}</span>
                    </Label>
                    <Select
                      value={order}
                      onValueChange={(value) => {
                        setOrder(value as SortOrder)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger
                        id="offer-order-filter"
                        className="h-9 w-full rounded-xl text-xs"
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

      {/* Table */}
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
        ) : offers.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <PackageX className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {t("noOffersMatchFilters")}
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
                <TableHead className="w-[30%] min-w-[200px] text-start">
                  {t("colProduct")}
                </TableHead>
                <TableHead className="w-[18%] min-w-[130px] px-4 text-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderSort("offerPrice")}
                    className="-ms-3 h-8 gap-1.5 font-semibold hover:bg-transparent"
                  >
                    <span>{t("colPrice")}</span>
                    {renderSortIcon("offerPrice")}
                  </Button>
                </TableHead>
                <TableHead className="w-[18%] min-w-[130px] text-start">
                  {t("colStock")}
                </TableHead>
                <TableHead className="w-[20%] min-w-[160px] text-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHeaderSort("startDate")}
                    className="-ms-3 h-8 gap-1.5 font-semibold hover:bg-transparent"
                  >
                    <span>{t("colDates")}</span>
                    {renderSortIcon("startDate")}
                  </Button>
                </TableHead>
                <TableHead className="w-[10%] min-w-[90px] text-center">
                  {t("colStatus")}
                </TableHead>
                <TableHead className="w-[60px] text-center">
                  {t("colActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer: ApiOffer) => {
                const product =
                  typeof offer.productId === "object" &&
                  offer.productId !== null
                    ? offer.productId
                    : null
                const productTitle = product?.title ?? "-"
                const productImage = product?.image?.secure_url
                const sold = computeSoldUnits(offer)

                return (
                  <TableRow
                    key={offer._id}
                    onClick={(e) => handleRowClick(offer._id, e)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    {/* Product */}
                    <TableCell className="w-[30%] min-w-[200px]">
                      <div className="flex items-center gap-3">
                        {productImage ? (
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                            <Image
                              fill
                              src={productImage}
                              alt={productTitle}
                              className="object-cover"
                              loading="lazy"
                              sizes="44px"
                            />
                          </div>
                        ) : (
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                            <Package className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-foreground">
                              {productTitle}
                            </span>
                            {offer.featured && (
                              <Badge className="px-1.5 py-0 text-[9px]">
                                {t("featured")}
                              </Badge>
                            )}
                          </div>
                          {offer.source === "ai_recommendation" && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="size-3" />
                              <span>{t("sourceAiRecommendation")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="w-[18%] min-w-[130px] px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            {formatCurrency(offer.offerPrice, locale)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px] font-bold"
                          >
                            -{offer.discountPercentage}%
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(offer.originalPrice, locale)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Stock */}
                    <TableCell className="w-[18%] min-w-[130px]">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 font-medium">
                          <span>{sold}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{offer.availableQuantity}</span>
                        </div>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, (sold / offer.availableQuantity) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="w-[22%] min-w-[180px] text-xs">
                      <div className="space-y-1.5 text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="size-3.5 shrink-0 text-primary" />
                          <span dir="auto" className="truncate">
                            {formatDate(offer.startDate, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ps-5 text-muted-foreground/80">
                          <span className="text-[10px] text-muted-foreground/60 rtl:rotate-180">
                            →
                          </span>
                          <span dir="auto" className="truncate">
                            {formatDate(offer.endDate, locale)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="w-[10%] min-w-[90px] text-center">
                      <Badge
                        variant={getStatusBadgeVariant(offer.status)}
                        className="text-[11px] capitalize"
                      >
                        {getOfferStatusLabel(offer.status, t)}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
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
                              <Link href={`/dashboard/offers/${offer._id}`} />
                            }
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="size-4" />
                            <span>{t("viewDetails")}</span>
                          </DropdownMenuItem>
                          {offer.status !== "cancelled" &&
                            offer.status !== "expired" && (
                              <DropdownMenuItem
                                render={
                                  <Link
                                    href={`/dashboard/offers/${offer._id}/edit`}
                                  />
                                }
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Pencil className="size-4" />
                                <span>{t("edit")}</span>
                              </DropdownMenuItem>
                            )}
                          {offer.status !== "cancelled" &&
                            offer.status !== "expired" &&
                            new Date(offer.endDate) > new Date() && (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => {
                                  setCancelTarget(offer)
                                  e.stopPropagation()
                                }}
                              >
                                <Ban className="size-4" />
                                <span>{t("cancelOffer")}</span>
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

      {/* Pagination */}
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

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
        onConfirm={handleCancelConfirm}
        title={t("cancelConfirmTitle")}
        description={t("cancelConfirmDesc")}
        confirmText={t("cancelOffer")}
        cancelText={t("cancel")}
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}
