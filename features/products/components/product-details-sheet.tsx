"use client"

import * as React from "react"
import { Loader2, Star } from "lucide-react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useProductById } from "@/features/products/hooks/use-products"
import type { ApiProduct } from "@/features/products/api/type"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ProductDetailsSheetProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getName(value: ApiProduct["category"] | ApiProduct["restaurantId"]) {
  return typeof value === "string" ? value : value?.name ?? "-"
}

export function ProductDetailsSheet({
  productId,
  open,
  onOpenChange,
}: ProductDetailsSheetProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.products")
  const { data: product, isLoading } = useProductById(open ? productId : null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="w-full overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border bg-card/60 p-5 text-start">
          <SheetTitle className="text-base font-bold">
            {t("productDetails")}
          </SheetTitle>
          <SheetDescription>
            {t("detailsSheetSub")}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : product ? (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              {product.image?.secure_url ? (
                <Image
                  fill
                  src={product.image.secure_url}
                  alt={product.title}
                  className="object-cover"
                  sizes="(min-width: 640px) 576px, 100vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold">
                  {product.title}
                </h2>
                {product.isBestseller && <Badge>{t("bestseller")}</Badge>}
                <Badge variant={product.isAvailable ? "secondary" : "outline"}>
                  {product.isAvailable ? t("available") : t("unavailable")}
                </Badge>
                {product.isDeleted && (
                  <Badge variant="destructive">{t("deleted")}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[11px]">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label={t("colPrice")} value={formatCurrency(product.price, locale)} />
              <Detail label={t("sortFreshnessWindow")} value={t("hoursSuffix", { count: product.freshnessWindow })} />
              <Detail label={t("colCategory")} value={getName(product.category)} />
              <Detail label={t("colRestaurant")} value={getName(product.restaurantId)} />
              <Detail
                label={t("ratingLabel")}
                value={
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-primary text-primary" />
                    {product.rating ?? 0} ({product.reviewsCount ?? 0})
                  </span>
                }
              />
              <Detail label={t("slugLabel")} value={product.slug} />
              <Detail label={t("createdLabel")} value={formatDate(product.createdAt, locale)} />
              <Detail label={t("updatedLabel")} value={formatDate(product.updatedAt, locale)} />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t("longDescLabel")}</h3>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
                {product.longDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {t("detailFetchError")}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">
        {value || "-"}
      </div>
    </div>
  )
}

