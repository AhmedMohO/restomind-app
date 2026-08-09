"use client"

import * as React from "react"
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Edit2,
  Package,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link, useRouter } from "@/i18n/routing"
import {
  useDeleteProduct,
  useProductById,
} from "@/features/products/hooks/use-products"
import type { ApiProduct } from "@/features/products/api/type"
import { formatCurrency, formatDate, getImageUrl } from "@/lib/utils"
import { getErrorMessage } from "@/lib/api/utils"

interface ProductDetailsContainerProps {
  id: string
}

function getName(value: ApiProduct["category"] | ApiProduct["restaurantId"]) {
  return typeof value === "string" ? value : (value?.name ?? "-")
}

function getRelativeTimeString(dateStr?: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const diffInMs = Date.now() - date.getTime()
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  if (diffInMins < 1) return "just now"
  if (diffInMins < 60) return `${diffInMins}m ago`
  const diffInHours = Math.floor(diffInMins / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

/** Small, quiet label/value pair used in the meta panel. */
function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        {children}
      </span>
    </div>
  )
}

/** A single figure in the stat strip. */
function Stat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: React.ReactNode
  emphasize?: boolean
}) {
  return (
    <div className="flex-1 px-5 py-4 first:ps-0 last:pe-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          emphasize
            ? "mt-1 text-2xl font-bold tracking-tight text-primary"
            : "mt-1 text-2xl font-bold tracking-tight text-foreground"
        }
      >
        {value}
      </p>
    </div>
  )
}

export function ProductDetailsContainer({ id }: ProductDetailsContainerProps) {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("Dashboard.products")
  const { data: product, isLoading, isError, refetch } = useProductById(id)
  const deleteMutation = useDeleteProduct()

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [copiedSlug, setCopiedSlug] = React.useState(false)

  const handleDeleteConfirm = async () => {
    if (!product) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync(product._id)
      toast.success(t("deleteSuccess"))
      router.push("/dashboard/products")
    } catch (err) {
      console.error("[ProductDetailsContainer] delete failed", err)
      toast.error(getErrorMessage(err, t("deleteError")))
      setIsDeleting(false)
    }
  }

  const handleCopySlug = () => {
    if (!product?.slug) return
    navigator.clipboard.writeText(product.slug)
    setCopiedSlug(true)
    toast.success(t("slugCopied"))
    setTimeout(() => setCopiedSlug(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="h-7 w-56 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-3xl bg-muted" />
            <div className="h-24 animate-pulse rounded-3xl bg-muted" />
            <div className="h-48 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Package className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t("detailFetchError")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl"
          >
            {t("retry")}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/products" />}
            className="rounded-xl"
          >
            {t("backToList")}
          </Button>
        </div>
      </div>
    )
  }

  const hasRatings =
    (product.rating ?? 0) > 0 || (product.reviewsCount ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <BackButton href="/dashboard/products" aria-label={t("backToList")} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {product.title}
              </h1>
              {product.isDeleted && (
                <Badge
                  variant="destructive"
                  className="rounded-full px-2.5 py-0.5 text-xs"
                >
                  {t("deleted")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {getName(product.category)} · {getName(product.restaurantId)}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <Button
            nativeButton={false}
            render={<Link href={`/dashboard/products/${product._id}/edit`} />}
            className="flex-1 gap-2 rounded-xl sm:flex-initial"
          >
            <Edit2 className="size-4" />
            <span>{t("editProduct")}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-initial"
          >
            <Trash2 className="size-4" />
            <span>{t("delete")}</span>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left column — image + meta panel */}
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-3xl border-border/80 p-2 shadow-2xs">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/50">
              <Image
                fill
                src={getImageUrl(product.image?.secure_url)}
                alt={product.title}
                className="object-cover"
                loading="lazy"
                sizes="(min-width: 1024px) 320px, 100vw"
              />

              {/* Status + bestseller overlay on the image itself */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-sm ${
                    product.isAvailable
                      ? "bg-emerald-500/90 text-white"
                      : "bg-amber-500/90 text-white"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-white" />
                  {product.isAvailable ? t("available") : t("unavailable")}
                </span>
                {product.isBestseller && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-primary shadow-xs backdrop-blur-sm">
                    <Sparkles className="size-3" />
                    {t("bestseller")}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Meta panel: category, restaurant, slug, timestamps — one place, no accordion */}
          <Card className="rounded-3xl border-border/80 p-5 shadow-2xs">
            <div className="divide-y divide-border/60">
              <MetaRow icon={Tag} label={t("colCategory")}>
                {getName(product.category)}
              </MetaRow>
              <MetaRow icon={Store} label={t("colRestaurant")}>
                {getName(product.restaurantId)}
              </MetaRow>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">
                  {t("slugLabel")}
                </span>
                <button
                  type="button"
                  onClick={handleCopySlug}
                  aria-label={t("copySlug")}
                  title={t("copySlug")}
                  className="group flex min-w-0 items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 font-mono text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <span className="truncate">{product.slug}</span>
                  {copiedSlug ? (
                    <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            <TooltipProvider>
              <div className="mt-1 flex flex-col gap-1.5 border-t border-border/60 pt-3">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-flex cursor-help items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                        <Calendar className="size-3" />
                        {t("createdLabel")}:{" "}
                        {formatDate(product.createdAt, locale)}
                      </span>
                    }
                  />
                  <TooltipContent>
                    <span>{getRelativeTimeString(product.createdAt)}</span>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-flex cursor-help items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                        <Calendar className="size-3" />
                        {t("updatedLabel")}:{" "}
                        {formatDate(product.updatedAt, locale)}
                      </span>
                    }
                  />
                  <TooltipContent>
                    <span>{getRelativeTimeString(product.updatedAt)}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </Card>
        </div>

        {/* Right column — stats, description, tags */}
        <div className="space-y-6">
          {/* Stat strip: price, freshness, rating in one quiet row */}
          <Card className="rounded-3xl border-border/80 p-2 shadow-2xs">
            <div className="flex divide-x divide-border/60">
              <Stat
                label={t("colPrice")}
                value={formatCurrency(product.price, locale)}
                emphasize
              />
              <Stat
                label={t("sortFreshnessWindow")}
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-muted-foreground" />
                    {t("hoursSuffix", { count: product.freshnessWindow })}
                  </span>
                }
              />
              <Stat
                label={t("ratingLabel")}
                value={
                  hasRatings ? (
                    <span className="inline-flex items-baseline gap-1">
                      <Star className="size-4 self-center fill-yellow-400 text-yellow-400" />
                      {product.rating}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({product.reviewsCount})
                      </span>
                    </span>
                  ) : (
                    <span className="text-base font-medium text-muted-foreground">
                      {t("noRatingsYet")}
                    </span>
                  )
                }
              />
            </div>
          </Card>

          {/* Description card */}
          <Card className="rounded-3xl border-border/80 p-6 shadow-2xs">
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("descriptionLabel") ?? "Description"}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {product.description || (
                    <span className="italic">
                      No short description available.
                    </span>
                  )}
                </p>
              </div>

              <div className="border-t border-border/60 pt-5">
                <h2 className="text-sm font-semibold text-foreground">
                  {t("longDescLabel")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {product.longDescription || (
                    <span className="italic">
                      No detailed description provided.
                    </span>
                  )}
                </p>
              </div>

              {product.tags?.length ? (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-5">
                  {product.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
