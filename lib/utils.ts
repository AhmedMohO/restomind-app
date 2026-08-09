import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateErr(
  tValidation: (k: string) => string,
  message?: string
): string {
  if (!message) return ""
  try {
    return tValidation(message)
  } catch {
    return message
  }
}

/**
 * Rounds a numeric price value to at most 2 decimal places accuracy (toFixed(2)).
 * E.g., roundPrice(10.3456) => 10.35, roundPrice(10.00) => 10
 */
export function roundPrice(value: number): number {
  const safeValue = Number.isFinite(value) ? value : 0
  return Math.round((safeValue + Number.EPSILON) * 100) / 100
}

/**
 * Checks if a price value has fraction digits after rounding to 2 decimal places.
 */
export function hasPriceFractions(value: number): boolean {
  const rounded = roundPrice(value)
  return !Number.isInteger(rounded)
}

/**
 * Formats a currency value with locale support.
 * - Accuracy up to 2 decimal places (toFixed(2)).
 * - If value has no fraction digits (integer), fraction digits are omitted.
 * - If value has fraction digits, displays up to maxFractionDigits (default 2).
 */
export function formatCurrency(
  value: number,
  locale: string = "ar",
  maxFractionDigits: number = 2
) {
  const safeValue = roundPrice(value)
  const hasFractions = hasPriceFractions(safeValue)

  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
      maximumFractionDigits: hasFractions ? maxFractionDigits : 0,
    }).format(safeValue)
  } catch {
    const formattedNum = formatNumber(safeValue, locale, maxFractionDigits)
    return `${formattedNum} ${locale === "ar" ? "ج.م" : "EGP"}`
  }
}

/**
 * Formats a numeric price without currency symbol.
 * Omits fraction digits if integer, otherwise shows up to maxFractionDigits.
 */
export function formatNumber(
  value: number,
  locale: string = "ar",
  maxFractionDigits: number = 2
) {
  const safeValue = roundPrice(value)
  const hasFractions = hasPriceFractions(safeValue)

  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: hasFractions ? maxFractionDigits : 0,
    }).format(safeValue)
  } catch {
    return String(safeValue)
  }
}

/**
 * Formats a price value with optional currency suffix/prefix.
 * Shared helper to format prices across pages.
 */
export function formatPrice(
  value: number,
  locale: string = "ar",
  includeCurrency: boolean = true
): string {
  if (includeCurrency) {
    return formatCurrency(value, locale)
  }
  return formatNumber(value, locale)
}


export function formatDate(value: string, locale: string = "ar") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

/**
 * Resolves an image URL safely.
 * Handles relative backend assets (/public/..., /assets/...) by routing them to backend API or fallback.
 * Passes blob: and data: URLs through untouched for instant local file upload previews.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return "/placeholder.svg"
  if (url.startsWith("blob:") || url.startsWith("data:")) return url
  if (
    url.includes("/assets/placeholder.svg") ||
    url.includes("/public/placeholder.svg")
  ) {
    return "/placeholder.svg"
  }
  if (url.startsWith("/")) {
    const apiPublicUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004"
    return `${apiPublicUrl.replace(/\/$/, "")}${url}`
  }
  return url
}