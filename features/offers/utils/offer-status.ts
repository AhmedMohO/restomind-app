import type { ApiOffer } from "@/features/offers/api/type"
import type { OfferStatus, Translator } from "@/features/offers/types"

/**
 * Returns the localised display label for a given offer status.
 */
export function getOfferStatusLabel(status: OfferStatus, t: Translator): string {
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

/**
 * Maps an offer status to the corresponding Badge variant.
 */
export function getStatusBadgeVariant(
  status: OfferStatus
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

/**
 * Returns the number of units sold for an offer.
 * Prefers `actualUnitsSold` from the API when available.
 */
export function computeSoldUnits(offer: ApiOffer): number {
  return offer.actualUnitsSold ?? offer.availableQuantity - offer.remainingQuantity
}
