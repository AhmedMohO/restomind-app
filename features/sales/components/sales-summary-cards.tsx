"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  BadgePercent,
  Coins,
  Receipt,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { SalesSummary } from "@/features/sales/api/type"

interface SalesSummaryCardsProps {
  summary?: SalesSummary
  isLoading: boolean
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint?: string
  isLoading: boolean
}) {
  return (
    <Card className="rounded-2xl border-border/80 p-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="h-7 w-24 rounded-lg" />
          ) : (
            <p className="truncate text-xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          )}
          {hint && !isLoading && (
            <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Aggregate figures for the active sales filter set.
 *
 * The revenue split mirrors the backend aggregation: gross is quantity × base
 * price, net is quantity × selling price, and discounts given is the gap
 * between them.
 */
export function SalesSummaryCards({
  summary,
  isLoading,
}: SalesSummaryCardsProps) {
  const t = useTranslations("Dashboard.sales")
  const locale = useLocale()

  const cards = [
    {
      icon: TrendingUp,
      label: t("kpiNetRevenue"),
      value: formatCurrency(summary?.totalNetRevenue ?? 0, locale, 2),
      hint: t("kpiNetRevenueHint"),
    },
    {
      icon: Coins,
      label: t("kpiGrossRevenue"),
      value: formatCurrency(summary?.totalGrossRevenue ?? 0, locale, 2),
      hint: t("kpiGrossRevenueHint"),
    },
    {
      icon: BadgePercent,
      label: t("kpiDiscounts"),
      value: formatCurrency(summary?.totalDiscountsGiven ?? 0, locale, 2),
      hint: t("kpiDiscountsHint"),
    },
    {
      icon: ShoppingBasket,
      label: t("kpiQuantitySold"),
      value: formatNumber(summary?.totalQuantitySold ?? 0, locale),
      hint: t("kpiQuantitySoldHint"),
    },
    {
      icon: Receipt,
      label: t("kpiTransactions"),
      value: formatNumber(summary?.totalTransactions ?? 0, locale),
      hint: t("kpiAvgPrice", {
        price: formatCurrency(summary?.averageSellingPrice ?? 0, locale, 2),
      }),
    },
    {
      icon: Sparkles,
      label: t("kpiPromotional"),
      value: formatNumber(summary?.promotionalSalesCount ?? 0, locale),
      hint: t("kpiFeatured", {
        count: formatNumber(summary?.featuredSalesCount ?? 0, locale),
      }),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} isLoading={isLoading} />
      ))}
    </div>
  )
}
