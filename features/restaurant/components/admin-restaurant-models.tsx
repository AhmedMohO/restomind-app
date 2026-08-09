"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Carrot,
  Edit2,
  Eye,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Link } from "@/i18n/routing"
import { clientFetch } from "@/lib/api/fetch-client"
import { buildQueryString } from "@/lib/api/utils"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

import type { DashboardOrderRow } from "@/features/orders/api/dashboard-types"
import type { PaginatedResponse as OrderPaginatedResponse } from "@/features/orders/api/type"
import type { ApiOffer, PaginatedOffers } from "@/features/offers/api/type"
import type {
  ApiProduct,
  PaginatedProducts,
} from "@/features/products/api/type"
import type {
  InventoryBatch,
  PaginatedBatches,
} from "@/features/inventory/types"
import type {
  ApiSupplier,
  PaginatedSuppliers,
} from "@/features/suppliers/types"
import type {
  ApiIngredient,
  PaginatedIngredients,
} from "@/features/ingredients/api/type"
import type {
  ApiPurchaseOrder,
  PaginatedPurchaseOrders,
} from "@/features/purchase-orders/types"

import Image from "next/image"
import { SupplierDetailsDialog } from "@/features/suppliers/components/supplier-details-dialog"

export type ModelTab =
  | "orders"
  | "offers"
  | "products"
  | "inventory"
  | "ingredients"
  | "purchase-orders"
  | "suppliers"

interface AdminRestaurantModelsProps {
  restaurantId: string
}

export function AdminRestaurantModels({
  restaurantId,
}: AdminRestaurantModelsProps) {
  const locale = useLocale()
  const tNav = useTranslations("Dashboard.nav")

  const [activeTab, setActiveTab] = React.useState<ModelTab>("orders")
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)

  // Dialog States for Suppliers
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<ApiSupplier | null>(null)
  const [isSupplierDetailsOpen, setIsSupplierDetailsOpen] =
    React.useState(false)

  const { page, setPage, resetPage, limit, setLimit } = useTableControls()

  // Reset page whenever tab or search term changes
  React.useEffect(() => {
    resetPage()
  }, [activeTab, debouncedSearch, resetPage])

  const handleTabChange = (tab: ModelTab) => {
    setActiveTab(tab)
    setSearch("")
    resetPage()
  }

  // --- QUERIES FOR EACH MODEL ---

  // 1. Orders Query
  const ordersQuery = useQuery<OrderPaginatedResponse<DashboardOrderRow>>({
    queryKey: [
      "admin-restaurant-orders",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      const qs = buildQueryString({
        restaurantId,
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      })
      const res = await clientFetch<OrderPaginatedResponse<DashboardOrderRow>>(
        `/orders${qs}`
      )
      return (
        res ?? {
          data: [],
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: limit,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      )
    },
    enabled: activeTab === "orders",
    staleTime: 20 * 1000,
  })

  // 2. Offers Query
  const offersQuery = useQuery<PaginatedOffers>({
    queryKey: [
      "admin-restaurant-offers",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      const qs = buildQueryString({
        restaurantId,
        page,
        limit,
        search: debouncedSearch || undefined,
      })
      const res = await clientFetch<PaginatedOffers>(`/offers${qs}`)
      return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
    },
    enabled: activeTab === "offers",
    staleTime: 20 * 1000,
  })

  // 3. Products Query
  const productsQuery = useQuery<PaginatedProducts>({
    queryKey: [
      "admin-restaurant-products",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      const qs = buildQueryString({
        restaurantId,
        page,
        limit,
        search: debouncedSearch || undefined,
      })
      const res = await clientFetch<PaginatedProducts>(`/products${qs}`)
      return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
    },
    enabled: activeTab === "products",
    staleTime: 20 * 1000,
  })

  // 4. Inventory Batches Query (Graceful fallback if backend unassigned)
  const inventoryQuery = useQuery<PaginatedBatches>({
    queryKey: ["admin-restaurant-inventory", restaurantId, page, limit],
    queryFn: async () => {
      try {
        const qs = buildQueryString({
          restaurantId,
          page,
          limit,
        })
        const res = await clientFetch<PaginatedBatches>(
          `/inventory/batches${qs}`
        )
        return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
      } catch {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 }
      }
    },
    enabled: activeTab === "inventory",
    staleTime: 20 * 1000,
  })

  // 5. Ingredients Query (Graceful fallback if backend unassigned)
  const ingredientsQuery = useQuery<PaginatedIngredients>({
    queryKey: [
      "admin-restaurant-ingredients",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      try {
        const qs = buildQueryString({
          restaurantId,
          page,
          limit,
          search: debouncedSearch || undefined,
        })
        const res = await clientFetch<PaginatedIngredients>(`/ingredients${qs}`)
        return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
      } catch {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 }
      }
    },
    enabled: activeTab === "ingredients",
    staleTime: 20 * 1000,
  })

  // 6. Purchase Orders Query (Graceful fallback if backend unassigned)
  const purchaseOrdersQuery = useQuery<PaginatedPurchaseOrders>({
    queryKey: [
      "admin-restaurant-purchase-orders",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      try {
        const qs = buildQueryString({
          restaurantId,
          page,
          limit,
          search: debouncedSearch || undefined,
        })
        const res = await clientFetch<PaginatedPurchaseOrders>(
          `/purchase-orders${qs}`
        )
        return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
      } catch {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 }
      }
    },
    enabled: activeTab === "purchase-orders",
    staleTime: 20 * 1000,
  })

  // 7. Suppliers Query (Graceful fallback if backend unassigned)
  const suppliersQuery = useQuery<PaginatedSuppliers>({
    queryKey: [
      "admin-restaurant-suppliers",
      restaurantId,
      page,
      limit,
      debouncedSearch,
    ],
    queryFn: async () => {
      try {
        const qs = buildQueryString({
          restaurantId,
          page,
          limit,
          search: debouncedSearch || undefined,
        })
        const res = await clientFetch<PaginatedSuppliers>(`/suppliers${qs}`)
        return res ?? { items: [], total: 0, page: 1, limit, totalPages: 1 }
      } catch {
        return { items: [], total: 0, page: 1, limit, totalPages: 1 }
      }
    },
    enabled: activeTab === "suppliers",
    staleTime: 20 * 1000,
  })

  // Helper to resolve current active query details
  const activeQueryDetails = React.useMemo(() => {
    switch (activeTab) {
      case "orders":
        return {
          isLoading: ordersQuery.isLoading,
          isError: ordersQuery.isError,
          refetch: ordersQuery.refetch,
          total: ordersQuery.data?.totalItems ?? 0,
          totalPages: ordersQuery.data?.totalPages ?? 1,
          itemsCount: ordersQuery.data?.data?.length ?? 0,
        }
      case "offers":
        return {
          isLoading: offersQuery.isLoading,
          isError: offersQuery.isError,
          refetch: offersQuery.refetch,
          total: offersQuery.data?.total ?? 0,
          totalPages: offersQuery.data?.totalPages ?? 1,
          itemsCount: offersQuery.data?.items?.length ?? 0,
        }
      case "products":
        return {
          isLoading: productsQuery.isLoading,
          isError: productsQuery.isError,
          refetch: productsQuery.refetch,
          total: productsQuery.data?.total ?? 0,
          totalPages: productsQuery.data?.totalPages ?? 1,
          itemsCount: productsQuery.data?.items?.length ?? 0,
        }
      case "inventory":
        return {
          isLoading: inventoryQuery.isLoading,
          isError: inventoryQuery.isError,
          refetch: inventoryQuery.refetch,
          total: inventoryQuery.data?.total ?? 0,
          totalPages: inventoryQuery.data?.totalPages ?? 1,
          itemsCount: inventoryQuery.data?.items?.length ?? 0,
        }
      case "ingredients":
        return {
          isLoading: ingredientsQuery.isLoading,
          isError: ingredientsQuery.isError,
          refetch: ingredientsQuery.refetch,
          total: ingredientsQuery.data?.total ?? 0,
          totalPages: ingredientsQuery.data?.totalPages ?? 1,
          itemsCount: ingredientsQuery.data?.items?.length ?? 0,
        }
      case "purchase-orders":
        return {
          isLoading: purchaseOrdersQuery.isLoading,
          isError: purchaseOrdersQuery.isError,
          refetch: purchaseOrdersQuery.refetch,
          total: purchaseOrdersQuery.data?.total ?? 0,
          totalPages: purchaseOrdersQuery.data?.totalPages ?? 1,
          itemsCount: purchaseOrdersQuery.data?.items?.length ?? 0,
        }
      case "suppliers":
        return {
          isLoading: suppliersQuery.isLoading,
          isError: suppliersQuery.isError,
          refetch: suppliersQuery.refetch,
          total: suppliersQuery.data?.total ?? 0,
          totalPages: suppliersQuery.data?.totalPages ?? 1,
          itemsCount: suppliersQuery.data?.items?.length ?? 0,
        }
    }
  }, [
    activeTab,
    ordersQuery.isLoading,
    ordersQuery.isError,
    ordersQuery.refetch,
    ordersQuery.data,
    offersQuery.isLoading,
    offersQuery.isError,
    offersQuery.refetch,
    offersQuery.data,
    productsQuery.isLoading,
    productsQuery.isError,
    productsQuery.refetch,
    productsQuery.data,
    inventoryQuery.isLoading,
    inventoryQuery.isError,
    inventoryQuery.refetch,
    inventoryQuery.data,
    ingredientsQuery.isLoading,
    ingredientsQuery.isError,
    ingredientsQuery.refetch,
    ingredientsQuery.data,
    purchaseOrdersQuery.isLoading,
    purchaseOrdersQuery.isError,
    purchaseOrdersQuery.refetch,
    purchaseOrdersQuery.data,
    suppliersQuery.isLoading,
    suppliersQuery.isError,
    suppliersQuery.refetch,
    suppliersQuery.data,
  ])

  const navItems = [
    {
      id: "orders" as ModelTab,
      label: tNav("orders"),
      icon: ShoppingBag,
      color: "text-blue-500 bg-blue-500/10",
      description: "Manage & view restaurant orders",
    },
    {
      id: "offers" as ModelTab,
      label: tNav("offers"),
      icon: Tag,
      color: "text-amber-500 bg-amber-500/10",
      description: "Active discounts and promotions",
    },
    {
      id: "products" as ModelTab,
      label: tNav("products"),
      icon: UtensilsCrossed,
      color: "text-emerald-500 bg-emerald-500/10",
      description: "Restaurant menu items and pricing",
    },
    {
      id: "inventory" as ModelTab,
      label: tNav("inventory"),
      icon: Package,
      color: "text-purple-500 bg-purple-500/10",
      description: "Ingredient batches & stock levels",
    },
    {
      id: "ingredients" as ModelTab,
      label: tNav("ingredients"),
      icon: Carrot,
      color: "text-orange-500 bg-orange-500/10",
      description: "Raw ingredients & safety stock thresholds",
    },
    {
      id: "purchase-orders" as ModelTab,
      label: tNav("purchaseOrders"),
      icon: Receipt,
      color: "text-cyan-500 bg-cyan-500/10",
      description: "Supplier procurement & delivery orders",
    },
    {
      id: "suppliers" as ModelTab,
      label: tNav("suppliers"),
      icon: Building2,
      color: "text-rose-500 bg-rose-500/10",
      description: "Partnered suppliers & lead times",
    },
  ]

  const handleOpenSupplierDetails = (supplier: ApiSupplier) => {
    setSelectedSupplier(supplier)
    setIsSupplierDetailsOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-full shrink-0 space-y-2 lg:w-64">
        <div className="mb-2 px-3">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Restaurant Models
          </h3>
        </div>

        <nav className="flex flex-row gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "flex min-w-[140px] items-center gap-3 rounded-2xl p-3 text-start transition-all lg:w-full",
                  isActive
                    ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                    : "bg-card text-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : item.color
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-xs lg:block",
                      isActive
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* --- CONTENT AREA --- */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Header & Search Bar & Actions */}
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {navItems.map((item) => {
                if (item.id !== activeTab) return null
                const Icon = item.icon
                return (
                  <React.Fragment key={item.id}>
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        item.color
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{item.label}</h2>
                      <p className="text-xs text-muted-foreground">
                        Total {activeQueryDetails.total} records found
                      </p>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input (where applicable) */}
              {activeTab !== "inventory" && (
                <div className="relative min-w-[180px] flex-1 sm:w-64 sm:flex-initial">
                  <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="rounded-xl ps-9 text-sm"
                  />
                </div>
              )}

              {/* ADMIN ACTION BUTTONS FOR CREATING/EDITING/MANAGING */}
              {activeTab === "products" && (
                <Button
                  nativeButton={false}
                  size="sm"
                  render={<Link href="/dashboard/products/new" />}
                  className="gap-2 rounded-xl text-xs"
                >
                  <Plus className="size-4" />
                  <span>Add Product</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- TABLE VIEWS FOR EACH TAB --- */}
        <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
          {/* 1. ORDERS TABLE */}
          {activeTab === "orders" && (
            <TableState
              isLoading={ordersQuery.isLoading}
              isError={ordersQuery.isError}
              isEmpty={(ordersQuery.data?.data?.length ?? 0) === 0}
              onRetry={() => ordersQuery.refetch()}
              emptyIcon={ShoppingBag}
              emptyTitle="No orders found"
              emptyDescription="No orders have been placed for this restaurant yet."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Order Ref</TableHead>
                    <TableHead className="text-start">Customer</TableHead>
                    <TableHead className="text-start">Total Amount</TableHead>
                    <TableHead className="text-start">
                      Delivery Method
                    </TableHead>
                    <TableHead className="text-start">Date</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ordersQuery.data?.data ?? []).map((order) => (
                    <TableRow
                      key={order.id || order.reference}
                      className="hover:bg-accent/40"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        #{order.reference}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold">
                            {order.customerName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {order.customerContact}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.finalTotalPrice, locale)}
                        <span className="ms-1 text-xs text-muted-foreground">
                          ({order.totalQuantity} items)
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.deliveryMethod || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt, locale)}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={`/dashboard/orders/${order.id}`} />
                          }
                          className="h-8 gap-1.5 rounded-lg text-xs"
                        >
                          <Eye className="size-3.5" />
                          <span>View Order</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 2. OFFERS TABLE */}
          {activeTab === "offers" && (
            <TableState
              isLoading={offersQuery.isLoading}
              isError={offersQuery.isError}
              isEmpty={(offersQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => offersQuery.refetch()}
              emptyIcon={Tag}
              emptyTitle="No active offers"
              emptyDescription="There are currently no active offers for this restaurant."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">
                      Product / Offer
                    </TableHead>
                    <TableHead className="text-start">Discount</TableHead>
                    <TableHead className="text-start">Price</TableHead>
                    <TableHead className="text-start">Source</TableHead>
                    <TableHead className="text-start">End Date</TableHead>
                    <TableHead className="text-start">Status</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(offersQuery.data?.items ?? []).map((offer: ApiOffer) => (
                    <TableRow key={offer._id} className="hover:bg-accent/40">
                      <TableCell className="font-semibold">
                        {typeof offer.productId === "object"
                          ? offer.productId.title
                          : "Offer Item"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-amber-500/20 bg-amber-500/10 font-bold text-amber-600"
                        >
                          -{offer.discountPercentage}% OFF
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(offer.offerPrice, locale)}
                        {offer.originalPrice > offer.offerPrice && (
                          <span className="ms-2 text-xs text-muted-foreground line-through">
                            {formatCurrency(offer.originalPrice, locale)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {offer.source === "ai_recommendation"
                            ? "AI Recommendation"
                            : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(offer.endDate, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600 capitalize">
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href={`/dashboard/offers/${offer._id}`} />
                            }
                            className="size-8 h-8 rounded-lg p-0"
                            title="View Offer Details"
                          >
                            <Eye className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="sm"
                            render={
                              <Link
                                href={`/dashboard/offers/${offer._id}/edit`}
                              />
                            }
                            className="size-8 h-8 rounded-lg p-0"
                            title="Edit Offer"
                          >
                            <Edit2 className="size-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 3. PRODUCTS TABLE */}
          {activeTab === "products" && (
            <TableState
              isLoading={productsQuery.isLoading}
              isError={productsQuery.isError}
              isEmpty={(productsQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => productsQuery.refetch()}
              emptyIcon={UtensilsCrossed}
              emptyTitle="No products found"
              emptyDescription="This restaurant has not added any products to its menu yet."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Product</TableHead>
                    <TableHead className="text-start">Category</TableHead>
                    <TableHead className="text-start">Price</TableHead>
                    <TableHead className="text-start">Availability</TableHead>
                    <TableHead className="text-start">Created At</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(productsQuery.data?.items ?? []).map((prod: ApiProduct) => (
                    <TableRow key={prod._id} className="hover:bg-accent/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {prod.image?.secure_url ? (
                            <Image
                              src={prod.image.secure_url}
                              alt={prod.title}
                              width={40}
                              height={40}
                              className="size-10 shrink-0 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <Store className="size-5" />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold">
                              {prod.title}
                            </span>
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {prod.description}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {typeof prod.category === "object"
                          ? prod.category.name
                          : "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {formatCurrency(prod.price, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={prod.isAvailable ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            prod.isAvailable
                              ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {prod.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(prod.createdAt, locale)}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href={`/dashboard/products/${prod._id}`} />
                            }
                            className="size-8 h-8 rounded-lg p-0"
                            title="View Product Details"
                          >
                            <Eye className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            nativeButton={false}
                            variant="ghost"
                            size="sm"
                            render={
                              <Link
                                href={`/dashboard/products/${prod._id}/edit`}
                              />
                            }
                            className="size-8 h-8 rounded-lg p-0"
                            title="Edit Product"
                          >
                            <Edit2 className="size-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 4. INVENTORY TABLE */}
          {activeTab === "inventory" && (
            <TableState
              isLoading={inventoryQuery.isLoading}
              isError={inventoryQuery.isError}
              isEmpty={(inventoryQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => inventoryQuery.refetch()}
              emptyIcon={Package}
              emptyTitle="No inventory batches"
              emptyDescription="No batch stock records available for this restaurant."
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Batch #</TableHead>
                    <TableHead className="text-start">Ingredient</TableHead>
                    <TableHead className="text-start">Qty Remaining</TableHead>
                    <TableHead className="text-start">Unit Cost</TableHead>
                    <TableHead className="text-start">Expiry Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventoryQuery.data?.items ?? []).map(
                    (batch: InventoryBatch) => (
                      <TableRow key={batch._id} className="hover:bg-accent/40">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {typeof batch.ingredientId === "object"
                            ? batch.ingredientId.name
                            : "Ingredient"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {batch.quantityRemaining}{" "}
                          <span className="text-xs text-muted-foreground">
                            {typeof batch.ingredientId === "object"
                              ? batch.ingredientId.unit
                              : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(batch.unitCost, locale)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(batch.expiryDate, locale)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 5. INGREDIENTS TABLE */}
          {activeTab === "ingredients" && (
            <TableState
              isLoading={ingredientsQuery.isLoading}
              isError={ingredientsQuery.isError}
              isEmpty={(ingredientsQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => ingredientsQuery.refetch()}
              emptyIcon={Carrot}
              emptyTitle="No ingredients found"
              emptyDescription="No raw ingredients configured for this restaurant."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Code</TableHead>
                    <TableHead className="text-start">
                      Ingredient Name
                    </TableHead>
                    <TableHead className="text-start">Unit</TableHead>
                    <TableHead className="text-start">Shelf Life</TableHead>
                    <TableHead className="text-start">
                      Min / Safety Stock
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(ingredientsQuery.data?.items ?? []).map(
                    (ing: ApiIngredient) => (
                      <TableRow key={ing._id} className="hover:bg-accent/40">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {ing.ingredientCode}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {ing.name}
                        </TableCell>
                        <TableCell className="text-xs uppercase">
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {ing.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ing.shelfLifeDays} Days
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ing.minimumStock} / {ing.safetyStock} {ing.unit}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 6. PURCHASE ORDERS TABLE */}
          {activeTab === "purchase-orders" && (
            <TableState
              isLoading={purchaseOrdersQuery.isLoading}
              isError={purchaseOrdersQuery.isError}
              isEmpty={(purchaseOrdersQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => purchaseOrdersQuery.refetch()}
              emptyIcon={Receipt}
              emptyTitle="No purchase orders"
              emptyDescription="No purchase orders have been created for this restaurant."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">PO ID</TableHead>
                    <TableHead className="text-start">Supplier</TableHead>
                    <TableHead className="text-start">Items Count</TableHead>
                    <TableHead className="text-start">Status</TableHead>
                    <TableHead className="text-start">
                      Expected Delivery
                    </TableHead>
                    <TableHead className="text-start">Created At</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(purchaseOrdersQuery.data?.items ?? []).map(
                    (po: ApiPurchaseOrder) => (
                      <TableRow key={po._id} className="hover:bg-accent/40">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          #{po._id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {typeof po.supplierId === "object"
                            ? po.supplierId.name
                            : "Supplier"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {po.items?.length ?? 0} Items
                        </TableCell>
                        <TableCell>
                          <Badge className="border-primary/20 bg-primary/10 text-xs text-primary capitalize">
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {po.expectedDeliveryDate
                            ? formatDate(po.expectedDeliveryDate, locale)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(po.createdAt, locale)}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                            render={
                              <Link
                                href={`/dashboard/purchase-orders/${po._id}`}
                              />
                            }
                            className="h-8 gap-1.5 rounded-lg text-xs"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            <span>View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableState>
          )}

          {/* 7. SUPPLIERS TABLE */}
          {activeTab === "suppliers" && (
            <TableState
              isLoading={suppliersQuery.isLoading}
              isError={suppliersQuery.isError}
              isEmpty={(suppliersQuery.data?.items?.length ?? 0) === 0}
              onRetry={() => suppliersQuery.refetch()}
              emptyIcon={Building2}
              emptyTitle="No suppliers found"
              emptyDescription="No suppliers have been linked to this restaurant."
              onClearFilters={search ? () => setSearch("") : undefined}
            >
              <Table className="min-w-[650px] sm:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">Supplier Name</TableHead>
                    <TableHead className="text-start">Email</TableHead>
                    <TableHead className="text-start">Phone</TableHead>
                    <TableHead className="text-start">Lead Time</TableHead>
                    <TableHead className="text-start">Created At</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(suppliersQuery.data?.items ?? []).map(
                    (sup: ApiSupplier) => (
                      <TableRow key={sup._id} className="hover:bg-accent/40">
                        <TableCell className="font-semibold">
                          {sup.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sup.email || "—"}
                        </TableCell>
                        <TableCell
                          dir="ltr"
                          className="text-xs text-muted-foreground"
                        >
                          {sup.phone || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {sup.leadTimeDays ?? 1} Days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sup.createdAt
                            ? formatDate(sup.createdAt, locale)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSupplierDetails(sup)}
                            className="h-8 gap-1.5 rounded-lg text-xs"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            <span>Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableState>
          )}
        </div>

        {/* --- REUSED TABLE PAGINATION --- */}
        <TablePagination
          page={page}
          totalPages={activeQueryDetails.totalPages}
          total={activeQueryDetails.total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          className="pt-2"
        />
      </div>

      {/* SUPPLIER MODAL DIALOGS FOR VIEW / CREATE */}
      <SupplierDetailsDialog
        supplier={selectedSupplier}
        open={isSupplierDetailsOpen}
        onOpenChange={setIsSupplierDetailsOpen}
        admin
      />
    </div>
  )
}
