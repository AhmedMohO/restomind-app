"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Info,
  Loader2,
  Percent,
  Sparkles,
  Tag,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PaginatedProductSelect } from "@/features/products/components/paginated-product-select"
import type { ApiProduct } from "@/features/products/api/type"
import type {  CreateOfferInput, UpdateOfferInput } from "@/features/offers/api/type"
import type { DiscountType, OfferStatus } from "@/features/offers/types"
import type { OfferFormProps } from "@/features/offers/types"
import {
  buildDateFromState,
  parseISOToState,
  resolveInitialOriginalPrice,
  resolveInitialProductId,
  resolveInitialSelectedProduct,
  getOfferStatusLabel,
} from "@/features/offers/utils"
import { TimePicker } from "@/features/offers/components/time-picker"
import { formatCurrency, formatDate } from "@/lib/utils"

export type { OfferFormProps }

// Computed once at module load — safe to use as a stable default inside useMemo
const DEFAULT_END_DATE_ISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

export function OfferForm({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: OfferFormProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.offers")

  // ─── Stable initial derivations ──────────────────────────────────────────

  const initialProductId = React.useMemo(
    () => resolveInitialProductId(initialData),
    [initialData]
  )
  const initialOriginalPrice = React.useMemo(
    () => resolveInitialOriginalPrice(initialData),
    [initialData]
  )
  const initialSelectedProduct = React.useMemo(
    () => resolveInitialSelectedProduct(initialData),
    [initialData]
  )

  const startParsed = React.useMemo(
    () => parseISOToState(initialData?.startDate, "12", "00", "PM"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally stable — only used for initial state
  )
  const endParsed = React.useMemo(
    () =>
      parseISOToState(
        initialData?.endDate ?? DEFAULT_END_DATE_ISO,
        "11",
        "55",
        "PM"
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ─── State ───────────────────────────────────────────────────────────────

  const [productId, setProductId] = React.useState<string>(initialProductId)
  const [selectedProduct, setSelectedProduct] = React.useState<ApiProduct | null>(
    initialSelectedProduct
  )
  const [discountType, setDiscountType] = React.useState<DiscountType>(
    initialData?.discountType ?? "percentage"
  )
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(
    initialData?.discountPercentage ?? 20
  )
  const [offerPrice, setOfferPrice] = React.useState<number>(
    initialData?.offerPrice ?? (initialOriginalPrice ? initialOriginalPrice * 0.8 : 0)
  )

  const [startDate, setStartDate] = React.useState<Date | undefined>(startParsed.date)
  const [startHour, setStartHour] = React.useState<string>(startParsed.hour)
  const [startMinute, setStartMinute] = React.useState<string>(startParsed.minute)
  const [startAmpm, setStartAmpm] = React.useState<string>(startParsed.ampm)

  const [endDate, setEndDate] = React.useState<Date | undefined>(endParsed.date)
  const [endHour, setEndHour] = React.useState<string>(endParsed.hour)
  const [endMinute, setEndMinute] = React.useState<string>(endParsed.minute)
  const [endAmpm, setEndAmpm] = React.useState<string>(endParsed.ampm)

  const [availableQuantity, setAvailableQuantity] = React.useState<number>(
    initialData?.availableQuantity ?? 10
  )
  const [maxPerCustomer, setMaxPerCustomer] = React.useState<string>(
    initialData?.maxPerCustomer ? String(initialData.maxPerCustomer) : ""
  )
  const [featured, setFeatured] = React.useState<boolean>(initialData?.featured ?? false)
  const [status, setStatus] = React.useState<OfferStatus>(initialData?.status ?? "active")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // ─── Derived values ───────────────────────────────────────────────────────

  const originalPrice = selectedProduct?.price ?? initialOriginalPrice ?? 0

  const isReadOnly =
    isEditing &&
    (initialData?.status === "expired" || initialData?.status === "cancelled")

  const canEditStartDate =
    (!isEditing && !isReadOnly) ||
    initialData?.status === "draft" ||
    initialData?.status === "scheduled"

  const alreadySold = initialData
    ? initialData.availableQuantity - initialData.remainingQuantity
    : 0

  const allowedStatuses = React.useMemo<OfferStatus[]>(() => {
    if (!isEditing) return ["active", "scheduled", "draft"]
    const current = initialData?.status ?? "active"
    switch (current) {
      case "draft":      return ["draft", "scheduled", "active", "cancelled"]
      case "scheduled":  return ["scheduled", "active", "cancelled"]
      case "active":     return ["active", "sold_out", "expired", "cancelled"]
      case "sold_out":   return ["sold_out", "active", "expired", "cancelled"]
      case "expired":    return ["expired"]
      case "cancelled":  return ["cancelled"]
      default:           return ["draft", "scheduled", "active", "sold_out", "expired", "cancelled"]
    }
  }, [isEditing, initialData?.status])

  const estimatedOfferPrice = React.useMemo(() => {
    if (discountType !== "percentage") return offerPrice
    if (!originalPrice) return 0
    return Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100
  }, [discountType, originalPrice, discountPercentage, offerPrice])

  const estimatedDiscountPercentage = React.useMemo(() => {
    if (discountType !== "fixed") return discountPercentage
    if (!originalPrice || offerPrice <= 0) return 0
    return Math.min(100, Math.max(1, Math.round((1 - offerPrice / originalPrice) * 100)))
  }, [discountType, originalPrice, offerPrice, discountPercentage])

  const finalStartFull = React.useMemo(
    () => buildDateFromState(startDate, startHour, startMinute, startAmpm),
    [startDate, startHour, startMinute, startAmpm]
  )

  const finalEndFull = React.useMemo(
    () => buildDateFromState(endDate, endHour, endMinute, endAmpm),
    [endDate, endHour, endMinute, endAmpm]
  )

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleProductChange = React.useCallback(
    (prodId: string, productObj?: ApiProduct) => {
      setProductId(prodId)
      if (productObj) setSelectedProduct(productObj)
    },
    []
  )

  const validate = React.useCallback((): boolean => {
    if (isReadOnly) return false
    const errs: Record<string, string> = {}
    const now = new Date()

    if (!isEditing && !productId) {
      errs.productId = t("productRequiredError")
    }

    if (discountType === "percentage") {
      if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
        errs.discountPercentage = t("discountRequiredError")
      }
    } else {
      if (!offerPrice || offerPrice <= 0) {
        errs.offerPrice = t("positiveOfferPriceError")
      } else if (originalPrice > 0 && offerPrice >= originalPrice) {
        errs.offerPrice = t("offerPriceLessThanOriginalError")
      }
    }

    if (!finalStartFull) errs.startDate = t("startDateRequiredError")
    if (!finalEndFull) errs.endDate = t("endDateRequiredError")
    if (finalStartFull && finalEndFull && finalStartFull >= finalEndFull) {
      errs.endDate = t("dateOrderError")
    }
    if (finalEndFull && finalEndFull <= now) {
      errs.endDate = t("endDateFutureError")
    }
    if (status === "active" && finalStartFull && finalStartFull > now && !isEditing) {
      errs.status = t("activeStatusFutureStartError")
    }
    if (
      (status === "draft" || status === "scheduled") &&
      finalStartFull &&
      finalStartFull < now &&
      !isEditing
    ) {
      errs.startDate = t("draftScheduledPastStartError")
    }
    if (!availableQuantity || availableQuantity < 1) {
      errs.availableQuantity = t("quantityRequiredError")
    }
    if (isEditing && availableQuantity < alreadySold) {
      errs.availableQuantity = t("quantityBelowSoldError", { sold: alreadySold })
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [
    isReadOnly, isEditing, productId, discountType, discountPercentage,
    offerPrice, originalPrice, finalStartFull, finalEndFull,
    status, availableQuantity, alreadySold, t,
  ])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (isReadOnly || !validate()) return

      if (isEditing) {
        const payload: UpdateOfferInput = {
          discountType,
          availableQuantity,
          maxPerCustomer: maxPerCustomer ? Number(maxPerCustomer) : undefined,
          featured,
          status,
        }

        if (discountType === "percentage") {
          payload.discountPercentage = discountPercentage
          payload.offerPrice = undefined
        } else {
          payload.offerPrice = offerPrice
          payload.discountPercentage = undefined
        }

        if (
          canEditStartDate &&
          finalStartFull &&
          finalStartFull.toISOString() !== new Date(initialData?.startDate ?? "").toISOString()
        ) {
          payload.startDate = finalStartFull.toISOString()
        }

        if (
          finalEndFull &&
          finalEndFull.toISOString() !== new Date(initialData?.endDate ?? "").toISOString()
        ) {
          payload.endDate = finalEndFull.toISOString()
        }

        await onSubmit(payload)
      } else {
        const payload: CreateOfferInput = {
          productId,
          discountType,
          startDate: finalStartFull?.toISOString() ?? new Date().toISOString(),
          endDate: finalEndFull?.toISOString() ?? new Date().toISOString(),
          availableQuantity,
          maxPerCustomer: maxPerCustomer ? Number(maxPerCustomer) : undefined,
          featured,
          status,
        }

        if (discountType === "percentage") {
          payload.discountPercentage = discountPercentage
        } else {
          payload.offerPrice = offerPrice
        }

        await onSubmit(payload)
      }
    },
    [
      isReadOnly, validate, isEditing, discountType, availableQuantity, maxPerCustomer,
      featured, status, discountPercentage, offerPrice, canEditStartDate,
      finalStartFull, finalEndFull, initialData?.startDate, initialData?.endDate,
      productId, onSubmit,
    ]
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isReadOnly && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <div className="text-xs font-semibold">
            {t("readOnlyWarning", { status: initialData?.status })}
          </div>
        </div>
      )}

      <Card className="rounded-2xl border border-border shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="size-5 text-primary" />
            <span>{t("formTitle")}</span>
          </CardTitle>
          <CardDescription>{t("formSub")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Product */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {t("product")} <span className="text-destructive">*</span>
            </Label>
            <PaginatedProductSelect
              value={productId}
              onValueChange={handleProductChange}
              disabled={isEditing}
            />
            {errors.productId && (
              <p className="text-xs text-destructive">{errors.productId}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="text-xs font-semibold">{t("discountType")}</Label>
              <div className="inline-flex rounded-xl bg-muted p-1 text-xs">
                {(["percentage", "fixed"] as DiscountType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
                    className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                      discountType === type
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type === "percentage" ? t("percentage") : t("fixedAmount")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Original Price (display only) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("originalPrice")}</Label>
                <div className="flex h-9 w-full items-center rounded-xl border border-input bg-muted px-3 text-sm font-medium">
                  {originalPrice > 0 ? formatCurrency(originalPrice, locale) : "-"}
                </div>
              </div>

              {/* Discount input */}
              {discountType === "percentage" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {t("discountPercentage")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Percent className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      className="rounded-xl ps-9"
                    />
                  </div>
                  {errors.discountPercentage && (
                    <p className="text-xs text-destructive">{errors.discountPercentage}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    {t("offerPrice")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="rounded-xl font-bold text-primary"
                  />
                  {errors.offerPrice && (
                    <p className="text-xs text-destructive">{errors.offerPrice}</p>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {discountType === "percentage" ? t("offerPrice") : t("discountPercentage")}
                </Label>
                <div className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-3 text-sm">
                  <span className="font-semibold text-primary">
                    {discountType === "percentage"
                      ? formatCurrency(estimatedOfferPrice, locale)
                      : `-${estimatedDiscountPercentage}%`}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t("preview")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                {t("availableQuantity")} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={alreadySold > 0 ? alreadySold : 1}
                value={availableQuantity}
                onChange={(e) => setAvailableQuantity(Number(e.target.value))}
                className="rounded-xl"
              />
              {alreadySold > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {t("alreadySoldHint", { sold: alreadySold })}
                </p>
              )}
              {errors.availableQuantity && (
                <p className="text-xs text-destructive">{errors.availableQuantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("maxPerCustomer")}</Label>
              <Input
                type="number"
                min={1}
                placeholder={t("unlimited")}
                value={maxPerCustomer}
                onChange={(e) => setMaxPerCustomer(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <CalendarIcon className="size-3.5 text-primary" />
                <span>{t("startDate")}</span>
                <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!canEditStartDate}
                      className="w-full justify-between rounded-xl px-3.5 text-xs font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {finalStartFull
                            ? formatDate(finalStartFull.toISOString(), locale)
                            : t("startDate")}
                        </span>
                      </span>
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-auto rounded-2xl border border-border p-0 shadow-lg">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={!canEditStartDate}
                  />
                  <TimePicker
                    hour={startHour}
                    minute={startMinute}
                    ampm={startAmpm}
                    disabled={!canEditStartDate}
                    onHourChange={setStartHour}
                    onMinuteChange={setStartMinute}
                    onAmpmChange={setStartAmpm}
                  />
                </PopoverContent>
              </Popover>
              {!canEditStartDate && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="size-3 shrink-0" />
                  <span>{t("startDateEditHint")}</span>
                </p>
              )}
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>

            {/* End */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <CalendarIcon className="size-3.5 text-primary" />
                <span>{t("endDate")}</span>
                <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between rounded-xl px-3.5 text-xs font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {finalEndFull
                            ? formatDate(finalEndFull.toISOString(), locale)
                            : t("endDate")}
                        </span>
                      </span>
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-auto rounded-2xl border border-border p-0 shadow-lg">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  <TimePicker
                    hour={endHour}
                    minute={endMinute}
                    ampm={endAmpm}
                    onHourChange={setEndHour}
                    onMinuteChange={setEndMinute}
                    onAmpmChange={setEndAmpm}
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("status")}</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as OfferStatus)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((st) => (
                    <SelectItem key={st} value={st}>
                      {getOfferStatusLabel(st, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>{t("featured")}</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">{t("featuredDesc")}</p>
              </div>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || isReadOnly} className="rounded-xl">
          {isSubmitting && <Loader2 className="me-2 size-4 animate-spin" />}
          <span>{isEditing ? t("saveChanges") : t("createOffer")}</span>
        </Button>
      </div>
    </form>
  )
}
