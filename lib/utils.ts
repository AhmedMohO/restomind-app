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
export function formatCurrency(value: number, locale: string = "ar") {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value} EGP`
  }
}

export function formatDate(value: string, locale: string = "ar") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}