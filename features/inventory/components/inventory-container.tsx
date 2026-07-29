"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  History,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIngredientsList } from "@/features/ingredients/hooks/use-ingredients"
import {
  useInventoryBatches,
  useStockTransactions,
  useWasteEvents,
} from "@/features/inventory/hooks/use-inventory"
import {
  StockTransactionTypeEnum,
  WasteReasonEnum,
  type InventoryBatch,
} from "@/features/inventory/types"

import { CreateBatchDialog } from "./create-batch-dialog"
import { CreateTransactionDialog } from "./create-transaction-dialog"
import { CreateWasteDialog } from "./create-waste-dialog"
import { ApiIngredient } from "@/features/ingredients/api"
import { Link } from "@/i18n/routing"

/** Pure helper — defined outside component so it never triggers react-hooks/purity */
function getExpiryStatus(
  expiryDateStr: string
): "expired" | "expiring" | "fresh" {
  const diffDays =
    (new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 3600 * 24)
  if (diffDays < 0) return "expired"
  if (diffDays <= 7) return "expiring"
  return "fresh"
}

export function InventoryContainer() {
  const t = useTranslations("Dashboard.inventory")
  const locale = useLocale()
  const isRtl = locale === "ar"

  const [activeTab, setActiveTab] = React.useState<
    "batches" | "transactions" | "waste"
  >("batches")

  // Modals state
  const [batchDialogOpen, setBatchDialogOpen] = React.useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] =
    React.useState(false)
  const [wasteDialogOpen, setWasteDialogOpen] = React.useState(false)

  // Filters state
  const [selectedIngredientFilter, setSelectedIngredientFilter] =
    React.useState<string>("all")
  const [selectedTypeFilter, setSelectedTypeFilter] =
    React.useState<string>("all")
  const [selectedReasonFilter, setSelectedReasonFilter] =
    React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // Pagination states
  const [batchPage, setBatchPage] = React.useState(1)
  const [txnPage, setTxnPage] = React.useState(1)
  const [wastePage, setWastePage] = React.useState(1)

  // Fetch ingredients list for dropdown filters and dialogs
  const { data: ingredientsData } = useIngredientsList({
    limit: 100,
  })
  const ingredients: ApiIngredient[] = ingredientsData?.items ?? []

  // Fetch Batches
  const {
    data: batchesData,
    isLoading: isLoadingBatches,
    refetch: refetchBatches,
  } = useInventoryBatches({
    page: batchPage,
    limit: 10,
    ingredientId:
      selectedIngredientFilter !== "all" ? selectedIngredientFilter : undefined,
  })

  // Fetch Stock Transactions
  const {
    data: transactionsData,
    isLoading: isLoadingTxns,
    refetch: refetchTxns,
  } = useStockTransactions({
    page: txnPage,
    limit: 10,
    ingredientId:
      selectedIngredientFilter !== "all" ? selectedIngredientFilter : undefined,
    transactionType:
      selectedTypeFilter !== "all"
        ? (selectedTypeFilter as StockTransactionTypeEnum)
        : undefined,
  })

  // Fetch Waste Events
  const {
    data: wasteData,
    isLoading: isLoadingWaste,
    refetch: refetchWaste,
  } = useWasteEvents({
    page: wastePage,
    limit: 10,
    ingredientId:
      selectedIngredientFilter !== "all" ? selectedIngredientFilter : undefined,
    wasteReason:
      selectedReasonFilter !== "all"
        ? (selectedReasonFilter as WasteReasonEnum)
        : undefined,
  })

  // Filter batches client-side search query
  const batchList = batchesData?.items ?? []
  const filteredBatches: InventoryBatch[] = batchList.filter(
    (b: InventoryBatch) => {
      if (!searchQuery) return true
      const ingName =
        typeof b.ingredientId === "object" ? b.ingredientId.name : ""
      return (
        b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ingName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  )

  const getExpiryBadge = (expiryDateStr: string) => {
    const status = getExpiryStatus(expiryDateStr)
    if (status === "expired") {
      return <Badge variant="destructive">{t("statusExpired")}</Badge>
    }
    if (status === "expiring") {
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          {t("statusExpiringSoon")}
        </Badge>
      )
    }
    return (
      <Badge
        variant="outline"
        className="border-emerald-500 text-emerald-600 dark:text-emerald-400"
      >
        {t("statusFresh")}
      </Badge>
    )
  }

  const getTransactionTypeBadge = (type: StockTransactionTypeEnum) => {
    switch (type) {
      case StockTransactionTypeEnum.PURCHASE:
      case StockTransactionTypeEnum.TRANSFER_IN:
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700">
            {t(`type_${type}`)}
          </Badge>
        )
      case StockTransactionTypeEnum.CONSUMPTION:
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            {t(`type_${type}`)}
          </Badge>
        )
      case StockTransactionTypeEnum.WASTE:
      case StockTransactionTypeEnum.TRANSFER_OUT:
      case StockTransactionTypeEnum.RETURN_TO_SUPPLIER:
        return <Badge variant="destructive">{t(`type_${type}`)}</Badge>
      case StockTransactionTypeEnum.ADJUSTMENT:
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            {t(`type_${type}`)}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{t(`type_${type}` as any)}</Badge>
    }
  }

  const getWasteReasonBadge = (reason: WasteReasonEnum) => {
    switch (reason) {
      case WasteReasonEnum.EXPIRED:
        return <Badge variant="destructive">{t(`reason_${reason}`)}</Badge>
      case WasteReasonEnum.SPOILED:
      case WasteReasonEnum.DAMAGED:
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700">
            {t(`reason_${reason}`)}
          </Badge>
        )
      case WasteReasonEnum.PREPARATION_LOSS:
      case WasteReasonEnum.OVERPRODUCTION:
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            {t(`reason_${reason}`)}
          </Badge>
        )
      default:
        return <Badge variant="outline">{t(`reason_${reason}`)}</Badge>
    }
  }

  const wasteList = wasteData?.items ?? []
  const totalWasteLoss = wasteList.reduce(
    (sum: number, item: { estimatedCost?: number }) =>
      sum + (item.estimatedCost || 0),
    0
  )

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* ---------------- Top Header ---------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/inventory/batches/new`}
            className={buttonVariants({
              className: "gap-2 rounded-xl text-xs font-semibold",
              variant: "default",
            })}
          >
            <Plus className="size-4" />
            <span>{t("addBatch")}</span>
          </Link>

          <Button
            onClick={() => setTransactionDialogOpen(true)}
            variant="outline"
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <ArrowLeftRight className="size-4" />
            <span>{t("logMovement")}</span>
          </Button>

          <Button
            onClick={() => setWasteDialogOpen(true)}
            variant="destructive"
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <Trash2 className="size-4" />
            <span>{t("logWaste")}</span>
          </Button>
        </div>
      </div>

      {/* ---------------- Overview Metrics ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTotalBatches")}
            </CardTitle>
            <Boxes className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batchesData?.total ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("statActiveBatchesHint")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTransactions")}
            </CardTitle>
            <History className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactionsData?.total ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("statTransactionsHint")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statWasteEvents")}
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wasteData?.total ?? 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("statWasteEventsHint")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statWasteLoss")}
            </CardTitle>
            <TrendingDown className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${totalWasteLoss.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("statWasteLossHint")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Main Content Tabs ---------------- */}
      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "batches" | "transactions" | "waste")
        }
        className="w-full space-y-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-11 rounded-xl bg-muted/60 p-1">
            <TabsTrigger
              value="batches"
              className="gap-2 rounded-lg text-xs font-medium data-[state=active]:bg-background"
            >
              <Boxes className="size-4" />
              <span>{t("tabBatches")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="gap-2 rounded-lg text-xs font-medium data-[state=active]:bg-background"
            >
              <ArrowLeftRight className="size-4" />
              <span>{t("tabTransactions")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="waste"
              className="gap-2 rounded-lg text-xs font-medium data-[state=active]:bg-background"
            >
              <Trash2 className="size-4" />
              <span>{t("tabWaste")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Controls & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            {activeTab === "batches" && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl ps-9 text-xs"
                />
              </div>
            )}

            {/* Ingredient Filter */}
            <Select
              value={selectedIngredientFilter}
              onValueChange={(val) => {
                if (val) setSelectedIngredientFilter(val)
              }}
            >
              <SelectTrigger className="h-10 w-[180px] rounded-xl text-xs">
                <SelectValue placeholder={t("filterAllIngredients")}>
                  {selectedIngredientFilter === "all"
                    ? t("filterAllIngredients")
                    : ingredients.find(
                        (ing) => ing._id === selectedIngredientFilter
                      )?.name || t("filterAllIngredients")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filterAllIngredients")}</SelectItem>
                {ingredients.map((ing) => (
                  <SelectItem key={ing._id} value={ing._id}>
                    {ing.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Extra filter for transactions tab */}
            {activeTab === "transactions" && (
              <Select
                value={selectedTypeFilter}
                onValueChange={(val) => {
                  if (val) setSelectedTypeFilter(val)
                }}
              >
                <SelectTrigger className="h-10 w-[160px] rounded-xl text-xs">
                  <SelectValue placeholder={t("filterAllTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filterAllTypes")}</SelectItem>
                  {Object.values(StockTransactionTypeEnum).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`type_${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Extra filter for waste tab */}
            {activeTab === "waste" && (
              <Select
                value={selectedReasonFilter}
                onValueChange={(val) => {
                  if (val) setSelectedReasonFilter(val)
                }}
              >
                <SelectTrigger className="h-10 w-[160px] rounded-xl text-xs">
                  <SelectValue placeholder={t("filterAllReasons")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filterAllReasons")}</SelectItem>
                  {Object.values(WasteReasonEnum).map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`reason_${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => {
                refetchBatches()
                refetchTxns()
                refetchWaste()
              }}
            >
              <RefreshCw className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* --- Tab 1: Batches --- */}
        <TabsContent value="batches" className="m-0">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("colBatchNumber")}</TableHead>
                    <TableHead>{t("colIngredient")}</TableHead>
                    <TableHead>{t("colQuantityRemaining")}</TableHead>
                    <TableHead>{t("colUnitCost")}</TableHead>
                    <TableHead>{t("colExpiryDate")}</TableHead>
                    <TableHead>{t("colStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBatches ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredBatches.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("noBatchesFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatches.map((batch) => {
                      const ingName =
                        typeof batch.ingredientId === "object"
                          ? batch.ingredientId.name
                          : t("unknownIngredient")
                      const ingUnit =
                        typeof batch.ingredientId === "object"
                          ? batch.ingredientId.unit
                          : ""

                      return (
                        <TableRow key={batch._id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {batch.batchNumber}
                          </TableCell>
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {ingName}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {batch.quantityRemaining} {ingUnit}
                          </TableCell>
                          <TableCell className="text-xs">
                            ${batch.unitCost?.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {getExpiryBadge(batch.expiryDate)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Batches Pagination */}
              {batchesData && batchesData.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <span className="text-xs text-muted-foreground">
                    {t("paginationPage")} {batchPage} {t("of")}{" "}
                    {batchesData.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={batchPage <= 1}
                      onClick={() => setBatchPage((p) => p - 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={batchPage >= batchesData.totalPages}
                      onClick={() => setBatchPage((p) => p + 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 2: Transactions --- */}
        <TabsContent value="transactions" className="m-0">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("colDate")}</TableHead>
                    <TableHead>{t("colIngredient")}</TableHead>
                    <TableHead>{t("colType")}</TableHead>
                    <TableHead>{t("colQuantity")}</TableHead>
                    <TableHead>{t("colBatch")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTxns ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : (transactionsData?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("noTransactionsFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (transactionsData?.items ?? []).map((txn) => {
                      const ingName =
                        typeof txn.ingredientId === "object"
                          ? txn.ingredientId.name
                          : t("unknownIngredient")
                      const batchNo =
                        typeof txn.batchId === "object" && txn.batchId
                          ? txn.batchId.batchNumber
                          : "-"

                      return (
                        <TableRow key={txn._id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(
                              txn.date || txn.createdAt || ""
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {ingName}
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(txn.transactionType)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {txn.quantity} {txn.unit}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {batchNo}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Transactions Pagination */}
              {transactionsData && transactionsData.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <span className="text-xs text-muted-foreground">
                    {t("paginationPage")} {txnPage} {t("of")}{" "}
                    {transactionsData.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txnPage <= 1}
                      onClick={() => setTxnPage((p) => p - 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txnPage >= transactionsData.totalPages}
                      onClick={() => setTxnPage((p) => p + 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab 3: Waste Events --- */}
        <TabsContent value="waste" className="m-0">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("colDate")}</TableHead>
                    <TableHead>{t("colIngredient")}</TableHead>
                    <TableHead>{t("colReason")}</TableHead>
                    <TableHead>{t("colQuantity")}</TableHead>
                    <TableHead>{t("colEstimatedCost")}</TableHead>
                    <TableHead>{t("colBatch")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingWaste ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : (wasteData?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        {t("noWasteFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (wasteData?.items ?? []).map((wst) => {
                      const ingName =
                        typeof wst.ingredientId === "object"
                          ? wst.ingredientId.name
                          : t("unknownIngredient")
                      const batchNo =
                        typeof wst.batchId === "object" && wst.batchId
                          ? wst.batchId.batchNumber
                          : "-"

                      return (
                        <TableRow key={wst._id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(
                              wst.date || wst.createdAt || ""
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium sm:text-sm">
                            {ingName}
                          </TableCell>
                          <TableCell>
                            {getWasteReasonBadge(wst.wasteReason)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {wst.quantity} {wst.unit}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-destructive">
                            ${wst.estimatedCost?.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {batchNo}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>

              {/* Waste Pagination */}
              {wasteData && wasteData.totalPages > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <span className="text-xs text-muted-foreground">
                    {t("paginationPage")} {wastePage} {t("of")}{" "}
                    {wasteData.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={wastePage <= 1}
                      onClick={() => setWastePage((p) => p - 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={wastePage >= wasteData.totalPages}
                      onClick={() => setWastePage((p) => p + 1)}
                      className="h-8 rounded-lg text-xs"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- Dialog Modals ---------------- */}
      <CreateBatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        ingredients={ingredients}
      />

      <CreateTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        ingredients={ingredients}
      />

      <CreateWasteDialog
        open={wasteDialogOpen}
        onOpenChange={setWasteDialogOpen}
        ingredients={ingredients}
      />
    </div>
  )
}
