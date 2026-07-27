"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, Calendar as CalendarIcon, Clock, Info, Loader2, Percent, Sparkles, Tag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { ApiOffer, CreateOfferInput, UpdateOfferInput } from "@/features/offers/api/type"
import { formatCurrency, formatDate } from "@/lib/utils"

interface OfferFormProps {
  initialData?: ApiOffer | null
  isEditing?: boolean
  onSubmit: (data: CreateOfferInput | UpdateOfferInput) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
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

function parseISOToState(isoStr?: string, defaultHour = "12", defaultMin = "00", defaultAmpm = "PM") {
  if (!isoStr) {
    return { date: new Date(), hour: defaultHour, minute: defaultMin, ampm: defaultAmpm }
  }
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) {
    return { date: new Date(), hour: defaultHour, minute: defaultMin, ampm: defaultAmpm }
  }
  let h = date.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  const hourStr = String(h).padStart(2, "0")
  const minStr = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, "0")
  return { date, hour: hourStr, minute: minStr, ampm }
}

function buildDateFromState(date?: Date, hourStr = "12", minStr = "00", ampm = "PM"): Date | undefined {
  if (!date) return undefined
  let h = parseInt(hourStr, 10) || 12
  if (ampm === "PM" && h < 12) h += 12
  if (ampm === "AM" && h === 12) h = 0
  const m = parseInt(minStr, 10) || 0
  const res = new Date(date)
  res.setHours(h, m, 0, 0)
  return res
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

export function OfferForm({
  initialData,
  isEditing = false,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: OfferFormProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.offers")

  const initialProductId =
    typeof initialData?.productId === "object" && initialData?.productId !== null
      ? initialData.productId._id
      : typeof initialData?.productId === "string"
      ? initialData.productId
      : ""

  const initialOriginalPrice =
    typeof initialData?.productId === "object" && initialData?.productId !== null
      ? initialData.productId.price
      : initialData?.originalPrice ?? 0

  const [productId, setProductId] = React.useState<string>(initialProductId)
  const [selectedProduct, setSelectedProduct] = React.useState<ApiProduct | null>(
    typeof initialData?.productId === "object" && initialData?.productId !== null
      ? initialData.productId
      : null
  )

  // Discount Type: "percentage" | "fixed"
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed">(
    initialData?.discountType === "fixed" || (initialData?.discountType as any) === "fixed_amount"
      ? "fixed"
      : "percentage"
  )
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(
    initialData?.discountPercentage ?? 20
  )
  const [offerPrice, setOfferPrice] = React.useState<number>(
    initialData?.offerPrice ?? (initialOriginalPrice ? initialOriginalPrice * 0.8 : 0)
  )

  // Start Date & Time state
  const startParsed = parseISOToState(initialData?.startDate, "12", "00", "PM")
  const [startDate, setStartDate] = React.useState<Date | undefined>(startParsed.date)
  const [startHour, setStartHour] = React.useState<string>(startParsed.hour)
  const [startMinute, setStartMinute] = React.useState<string>(startParsed.minute)
  const [startAmpm, setStartAmpm] = React.useState<string>(startParsed.ampm)

  // End Date & Time state
  const endParsed = parseISOToState(
    initialData?.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    "11",
    "55",
    "PM"
  )
  const [endDate, setEndDate] = React.useState<Date | undefined>(endParsed.date)
  const [endHour, setEndHour] = React.useState<string>(endParsed.hour)
  const [endMinute, setEndMinute] = React.useState<string>(endParsed.minute)
  const [endAmpm, setEndAmpm] = React.useState<string>(endParsed.ampm)

  const alreadySold = initialData
    ? initialData.availableQuantity - initialData.remainingQuantity
    : 0

  const [availableQuantity, setAvailableQuantity] = React.useState<number>(
    initialData?.availableQuantity ?? 10
  )
  const [maxPerCustomer, setMaxPerCustomer] = React.useState<string>(
    initialData?.maxPerCustomer ? String(initialData.maxPerCustomer) : ""
  )
  const [featured, setFeatured] = React.useState<boolean>(
    initialData?.featured ?? false
  )
  const [status, setStatus] = React.useState<ApiOffer["status"]>(
    initialData?.status ?? "active"
  )

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const originalPrice = selectedProduct?.price ?? initialOriginalPrice ?? 0
  const isReadOnly = isEditing && (initialData?.status === "expired" || initialData?.status === "cancelled")
  const canEditStartDate = !isEditing && !isReadOnly || (initialData?.status === "draft" || initialData?.status === "scheduled")

  // Derive allowed status transitions based on backend OfferRulesService
  const allowedStatuses = React.useMemo<ApiOffer["status"][]>(() => {
    if (!isEditing) {
      return ["active", "scheduled", "draft"]
    }
    const current = initialData?.status ?? "active"
    switch (current) {
      case "draft":
        return ["draft", "scheduled", "active", "cancelled"]
      case "scheduled":
        return ["scheduled", "active", "cancelled"]
      case "active":
        return ["active", "sold_out", "expired", "cancelled"]
      case "sold_out":
        return ["sold_out", "active", "expired", "cancelled"]
      case "expired":
        return ["expired"]
      case "cancelled":
        return ["cancelled"]
      default:
        return ["draft", "scheduled", "active", "sold_out", "expired", "cancelled"]
    }
  }, [isEditing, initialData?.status])

  // Calculated preview values
  const estimatedOfferPrice = React.useMemo(() => {
    if (discountType === "percentage") {
      if (!originalPrice) return 0
      return Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100
    }
    return offerPrice
  }, [discountType, originalPrice, discountPercentage, offerPrice])

  const estimatedDiscountPercentage = React.useMemo(() => {
    if (discountType === "fixed") {
      if (!originalPrice || offerPrice <= 0) return 0
      const rawPct = (1 - offerPrice / originalPrice) * 100
      return Math.min(100, Math.max(1, Math.round(rawPct)))
    }
    return discountPercentage
  }, [discountType, originalPrice, offerPrice, discountPercentage])

  const handleProductChange = (prodId: string, productObj?: ApiProduct) => {
    setProductId(prodId)
    if (productObj) {
      setSelectedProduct(productObj)
    }
  }

  const finalStartFull = buildDateFromState(startDate, startHour, startMinute, startAmpm)
  const finalEndFull = buildDateFromState(endDate, endHour, endMinute, endAmpm)

  const validate = (): boolean => {
    if (isReadOnly) return false
    const errs: Record<string, string> = {}

    if (!isEditing && !productId) {
      errs.productId = t("productRequiredError")
    }

    if (discountType === "percentage") {
      if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
        errs.discountPercentage = t("discountRequiredError")
      }
    } else {
      if (!offerPrice || offerPrice <= 0) {
        errs.offerPrice = t("positiveValue") ?? "Offer price must be greater than zero"
      } else if (originalPrice > 0 && offerPrice >= originalPrice) {
        errs.offerPrice = "Offer price must be less than product original price"
      }
    }

    const now = new Date()

    if (!finalStartFull) {
      errs.startDate = t("startDateRequiredError")
    }
    if (!finalEndFull) {
      errs.endDate = t("endDateRequiredError")
    }

    if (finalStartFull && finalEndFull && finalStartFull >= finalEndFull) {
      errs.endDate = t("dateOrderError")
    }

    if (finalEndFull && finalEndFull <= now) {
      errs.endDate = "End date must be in the future"
    }

    if (status === "active" && finalStartFull && finalStartFull > now && !isEditing) {
      errs.status = "Status cannot be active when start date is in the future"
    }

    if ((status === "draft" || status === "scheduled") && finalStartFull && finalStartFull < now && !isEditing) {
      errs.startDate = "Start date must be in the future for a draft/scheduled offer"
    }

    if (!availableQuantity || availableQuantity < 1) {
      errs.availableQuantity = t("quantityRequiredError")
    }

    if (isEditing && availableQuantity < alreadySold) {
      errs.availableQuantity = `Available quantity cannot be less than ${alreadySold} unit(s) already sold`
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Send startDate ONLY if allowed and modified
      if (
        canEditStartDate &&
        finalStartFull &&
        finalStartFull.toISOString() !== new Date(initialData?.startDate || "").toISOString()
      ) {
        payload.startDate = finalStartFull.toISOString()
      }

      // Send endDate ONLY if modified
      if (
        finalEndFull &&
        finalEndFull.toISOString() !== new Date(initialData?.endDate || "").toISOString()
      ) {
        payload.endDate = finalEndFull.toISOString()
      }

      await onSubmit(payload)
    } else {
      const payload: CreateOfferInput = {
        productId,
        discountType,
        startDate: finalStartFull ? finalStartFull.toISOString() : new Date().toISOString(),
        endDate: finalEndFull ? finalEndFull.toISOString() : new Date().toISOString(),
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
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isReadOnly && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <div className="text-xs font-semibold">
            Cannot edit an offer with status "{initialData?.status}". This offer is final and read-only.
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
          {/* Product Selector */}
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

          {/* Pricing & Discount Type Controls */}
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="text-xs font-semibold">{t("discountType")}</Label>
              <div className="inline-flex rounded-xl bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDiscountType("percentage")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                    discountType === "percentage"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("percentage")}
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                    discountType === "fixed"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("fixedAmount")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Original Price */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{t("originalPrice")}</Label>
                <div className="flex h-9 w-full items-center rounded-xl border border-input bg-muted px-3 text-sm font-medium">
                  {originalPrice > 0 ? formatCurrency(originalPrice, locale) : "-"}
                </div>
              </div>

              {/* Input for Percentage Mode */}
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
                /* Input for Fixed Price Mode */
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

              {/* Derived Price / Percentage Badge Preview */}
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
                    Preview
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quantities Grid */}
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
                  ({alreadySold} unit(s) already sold)
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

          {/* Fully Responsive 100% Shadcn Date & Time Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start Date & Time Popover */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <CalendarIcon className="size-3.5 text-primary" />
                <span>{t("startDate")}</span> <span className="text-destructive">*</span>
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
                        <CalendarIcon className="size-4 text-primary shrink-0" />
                        <span className="truncate">
                          {finalStartFull
                            ? formatDate(finalStartFull.toISOString(), locale)
                            : t("startDate")}
                        </span>
                      </span>
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-auto p-0 rounded-2xl border border-border shadow-lg">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={!canEditStartDate}
                  />
                  {/* Shadcn Time Selection Bar */}
                  <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3 gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Clock className="size-3.5 text-primary" />
                      <span>Time</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={startHour} onValueChange={(val) => val && setStartHour(val)} disabled={!canEditStartDate}>
                        <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="font-bold text-muted-foreground">:</span>

                      <Select value={startMinute} onValueChange={(val) => val && setStartMinute(val)} disabled={!canEditStartDate}>
                        <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MINUTES.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={startAmpm} onValueChange={(val) => val && setStartAmpm(val)} disabled={!canEditStartDate}>
                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {!canEditStartDate && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="size-3 shrink-0" />
                  <span>(Start date can only be changed when offer is draft or scheduled)</span>
                </p>
              )}
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>

            {/* End Date & Time Popover */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <CalendarIcon className="size-3.5 text-primary" />
                <span>{t("endDate")}</span> <span className="text-destructive">*</span>
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
                        <CalendarIcon className="size-4 text-primary shrink-0" />
                        <span className="truncate">
                          {finalEndFull
                            ? formatDate(finalEndFull.toISOString(), locale)
                            : t("endDate")}
                        </span>
                      </span>
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-auto p-0 rounded-2xl border border-border shadow-lg">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                  {/* Shadcn Time Selection Bar */}
                  <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3 gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Clock className="size-3.5 text-primary" />
                      <span>Time</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={endHour} onValueChange={(val) => val && setEndHour(val)}>
                        <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="font-bold text-muted-foreground">:</span>

                      <Select value={endMinute} onValueChange={(val) => val && setEndMinute(val)}>
                        <SelectTrigger className="h-8 w-14 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MINUTES.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={endAmpm} onValueChange={(val) => val && setEndAmpm(val)}>
                        <SelectTrigger className="h-8 w-16 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Status & Featured Options */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t("status")}</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as ApiOffer["status"])}
              >
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

      {/* Form Action Buttons */}
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
