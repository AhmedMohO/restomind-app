"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  Ban,
  Calendar,
  Clock,
  Loader2,
  Package,
  Pencil,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Leaf,
  User,
} from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Link } from "@/i18n/routing"
import { useCancelOffer, useOfferById } from "@/features/offers/hooks/use-offers"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"
import type { ApiOffer } from "../api/type"

interface OfferDetailsContainerProps {
  offerId: string
}

function getOfferStatusLabel(
  status: ApiOffer["status"],
  t: (key: string) => string
): string {
  switch (status) {
    case "active":
      return t("statusActive")
    case "scheduled":
      return t("statusScheduled")
    case "draft":
      return t("statusDraft")
    case "sold_out":
      return t("statusSoldOut")
    case "expired":
      return t("statusExpired")
    case "cancelled":
      return t("statusCancelled")
    default:
      return status
  }
}

function getStatusBadgeVariant(
  status: ApiOffer["status"]
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
      return "default"
    case "scheduled":
      return "outline"
    case "draft":
      return "secondary"
    case "sold_out":
      return "secondary"
    case "expired":
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

export function OfferDetailsContainer({ offerId }: OfferDetailsContainerProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.offers")
  const { hasRole } = useAuth()
  const isManager = hasRole("manager")

  const { data: offer, isLoading, isError, refetch } = useOfferById(offerId)
  const cancelMutation = useCancelOffer()
  const [showCancelModal, setShowCancelModal] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !offer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("detailFetchError")}</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="rounded-xl"
        >
          {t("retry")}
        </Button>
      </div>
    )
  }

  const productObj = typeof offer.productId === "object" ? offer.productId : null
  const productTitle = productObj?.title ?? "-"
  const productImage = productObj?.image?.secure_url
  const productDesc = productObj?.description
  const categoryTitle =
    typeof productObj?.category === "object" && productObj?.category !== null
      ? productObj.category.name
      : undefined

  const sold = offer.actualUnitsSold ?? (offer.availableQuantity - offer.remainingQuantity)
  const percentSold = Math.min(100, Math.max(0, Math.round((sold / offer.availableQuantity) * 100)))

  const createdByName = offer.createdBy
    ? `${offer.createdBy.firstName || ""} ${offer.createdBy.lastName || ""}`.trim() || offer.createdBy.email
    : null

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(offer._id)
      toast.success(t("cancelSuccess"))
      setShowCancelModal(false)
    } catch (err) {
      console.error("[OfferDetailsContainer] Cancel offer failed", err)
      toast.error(getErrorMessage(err, t("cancelError")))
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/offers" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {productTitle}
              </h1>
              <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize text-xs font-semibold">
                {getOfferStatusLabel(offer.status, t)}
              </Badge>
              {offer.source === "ai_recommendation" ? (
                <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  <Sparkles className="size-3" />
                  <span>{t("sourceAiRecommendation")}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Tag className="size-3 text-muted-foreground" />
                  <span>{t("sourceManual")}</span>
                </Badge>
              )}
              {offer.featured && (
                <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                  <Sparkles className="size-3" />
                  <span>{t("featured")}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isManager && offer.status !== "cancelled" && offer.status !== "expired" && (
            <Button
              nativeButton={false}
              render={<Link href={`/dashboard/offers/${offer._id}/edit`} />}
              variant="outline"
              className="gap-2 rounded-xl"
            >
              <Pencil className="size-4" />
              <span>{t("edit")}</span>
            </Button>
          )}
          {isManager &&
            offer.status !== "cancelled" &&
            offer.status !== "expired" &&
            new Date(offer.endDate) > new Date() && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelModal(true)}
                className="gap-2 rounded-xl"
              >
                <Ban className="size-4" />
                <span>{t("cancelOffer")}</span>
              </Button>
            )}
        </div>
      </div>

      {/* Primary KPI Highlights (Single Source of Truth, Non-Repetitive) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Offer Price & Savings */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("offerPrice")}</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Tag className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(offer.offerPrice, locale)}
              </span>
              <span className="text-xs font-medium text-muted-foreground line-through">
                {formatCurrency(offer.originalPrice, locale)}
              </span>
            </div>
            <div>
              <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-bold">
                {t("offDiscount", { percent: offer.discountPercentage })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Inventory & Units Sold */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("unitsSold")}</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Package className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {sold} <span className="text-sm font-normal text-muted-foreground">/ {offer.availableQuantity}</span>
              </span>
              <span className="text-xs font-bold text-muted-foreground">{percentSold}%</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${percentSold}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("unitsRemaining", { count: offer.remainingQuantity })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Revenue & Eco-Impact */}
        <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-2xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {t("actualRevenue")}
              </span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {offer.actualRevenueRecovered !== undefined
                ? formatCurrency(offer.actualRevenueRecovered, locale)
                : offer.estimatedRevenueRecovery !== undefined
                ? formatCurrency(offer.estimatedRevenueRecovery, locale)
                : formatCurrency(sold * offer.offerPrice, locale)}
            </div>
            {offer.estimatedWasteReduction && (
              <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 flex items-center gap-1">
                <Leaf className="size-3" />
                <span>{t("wasteSaved", { count: offer.estimatedWasteReduction })}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Metric 4: Customer Limits */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("maxPerCustomer")}</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <User className="size-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {offer.maxPerCustomer ? offer.maxPerCustomer : t("unlimited")}
            </div>
            <p className="text-xs text-muted-foreground">
              {offer.maxPerCustomer
                ? t("maxUnitsPerCustomer", { count: offer.maxPerCustomer })
                : t("noCustomerLimits")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Grid (Clean 2 Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Product Info Card */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs lg:col-span-1">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Utensils className="size-4 text-primary" />
              <span>{t("product")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {productImage ? (
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-2xs">
                <Image
                  fill
                  src={productImage}
                  alt={productTitle}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ) : (
              <div className="flex aspect-4/3 w-full items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="size-14 opacity-70" />
              </div>
            )}

            <div className="space-y-2">
              {categoryTitle && (
                <Badge variant="outline" className="text-[11px]">
                  {categoryTitle}
                </Badge>
              )}
              {productDesc && (
                <p className="text-xs/relaxed text-muted-foreground">
                  {productDesc}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Schedule & Administrative Info */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="size-4 text-primary" />
              <span>{t("colDates")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-medium text-muted-foreground">{t("startDate")}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(offer.startDate, locale)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <span className="block text-xs font-medium text-muted-foreground">{t("endDate")}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDate(offer.endDate, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Creation & Manager Audit Trail */}
            {(createdByName || offer.createdAt) && (
              <div className="flex flex-wrap items-center justify-between rounded-xl border border-border/60 bg-card p-3.5 text-xs text-muted-foreground gap-2">
                {createdByName && (
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    <span>{t("createdBy", { name: createdByName })}</span>
                  </div>
                )}
                {offer.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>{t("createdOn", { date: formatDate(offer.createdAt, locale) })}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Modal */}
      <ConfirmDialog
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
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
