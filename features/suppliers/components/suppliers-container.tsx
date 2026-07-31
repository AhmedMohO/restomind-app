"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Building2,
  Clock,
  Mail,
  Phone,
  Plus,
  Search,
  Truck,
  Users,
  X,
  Zap,
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
import { formatDate } from "@/lib/utils"
import type { ApiSupplier } from "../types"
import { useSuppliersList } from "../hooks/use-suppliers"
import { SupplierDetailsDialog } from "./supplier-details-dialog"
import { SupplierFormDialog } from "./supplier-form-dialog"

export function SuppliersContainer() {
  const t = useTranslations("Dashboard.suppliers")

  const { page, setPage, resetPage, limit, setLimit } = useTableControls()

  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<ApiSupplier | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetPage()
  }

  const { data, isLoading, isError, refetch } = useSuppliersList({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const items = data?.items
  const suppliers: ApiSupplier[] = React.useMemo(
    () => items ?? [],
    [items]
  )
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const isFiltered = Boolean(debouncedSearch)

  // Compute metrics
  const avgLeadTime = React.useMemo(() => {
    if (!suppliers.length) return 0
    const sum = suppliers.reduce((acc, s) => acc + (s.leadTimeDays ?? 1), 0)
    return Math.round((sum / suppliers.length) * 10) / 10
  }, [suppliers])

  const withContactCount = React.useMemo(() => {
    return suppliers.filter((s) => Boolean(s.email || s.phone)).length
  }, [suppliers])

  const fastLeadTimeCount = React.useMemo(() => {
    return suppliers.filter((s) => (s.leadTimeDays ?? 1) <= 2).length
  }, [suppliers])

  const handleViewDetails = (supplier: ApiSupplier) => {
    setSelectedSupplier(supplier)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            <Building2 className="size-7 text-primary" />
            {t("title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="shrink-0 gap-2">
          <Plus className="size-4" />
          {t("addSupplierButton")}
        </Button>
      </div>

      {/* Metrics / Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Suppliers */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("metrics.totalSuppliers")}
              </p>
              <p className="text-2xl font-bold tracking-tight">{total}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Lead Time */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("metrics.avgLeadTime")}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {avgLeadTime}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {t("metrics.days")}
                </span>
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Coverage */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("metrics.contactCoverage")}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {suppliers.length > 0
                  ? `${Math.round((withContactCount / suppliers.length) * 100)}%`
                  : "0%"}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Mail className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Fast Delivery Metric */}
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {t("metrics.fastFulfillment")}
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {fastLeadTimeCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {total}
                </span>
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar / Search & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-9 pe-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 size-7 text-muted-foreground hover:text-foreground"
              onClick={() => handleSearchChange("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <TableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={suppliers.length === 0}
          onRetry={() => refetch()}
          onClearFilters={isFiltered ? () => handleSearchChange("") : undefined}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30%]">{t("table.name")}</TableHead>
                <TableHead>{t("table.contact")}</TableHead>
                <TableHead>{t("table.leadTime")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
                <TableHead className="w-[100px] text-right">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow
                  key={supplier._id}
                  onClick={() => handleViewDetails(supplier)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  {/* Supplier Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-foreground">
                          {supplier.name}
                        </span>
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          ID: {supplier._id.slice(-6)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {supplier.email ? (
                        <a
                          href={`mailto:${supplier.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Mail className="size-3.5 shrink-0 text-primary/70" />
                          <span className="truncate">{supplier.email}</span>
                        </a>
                      ) : null}
                      {supplier.phone ? (
                        <a
                          href={`tel:${supplier.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Phone className="size-3.5 shrink-0 text-primary/70" />
                          <span>{supplier.phone}</span>
                        </a>
                      ) : null}
                      {!supplier.email && !supplier.phone && (
                        <span className="text-xs text-muted-foreground/60 italic">
                          {t("noContact")}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Lead Time Days */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1 px-2.5 py-0.5 font-medium"
                    >
                      <Clock className="size-3 text-amber-500" />
                      {t("leadTimeBadge", {
                        count: supplier.leadTimeDays ?? 1,
                      })}
                    </Badge>
                  </TableCell>

                  {/* Created At */}
                  <TableCell className="text-xs text-muted-foreground">
                    {supplier.createdAt ? formatDate(supplier.createdAt) : "—"}
                  </TableCell>

                  {/* Direct Action Button */}
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                      render={
                        <Link
                          href={`/dashboard/purchase-orders/new?supplierId=${supplier._id}`}
                        >
                          <Truck className="size-3.5" />
                          <span>{t("actions.createPo")}</span>
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableState>
      </div>

      {/* Pagination Controls */}
      {!isLoading && !isError && suppliers.length > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit)
            resetPage()
          }}
        />
      )}

      {/* Create Supplier Dialog */}
      <SupplierFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

      {/* Details Dialog */}
      <SupplierDetailsDialog
        supplier={selectedSupplier}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
