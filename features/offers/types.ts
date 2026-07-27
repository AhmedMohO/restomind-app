import type { useTranslations } from "next-intl"

import type { ApiOffer, CreateOfferInput, GetOffersParams, UpdateOfferInput } from "@/features/offers/api/type"

// ─── Narrow aliases ──────────────────────────────────────────────────────────

export type OfferStatus = ApiOffer["status"]
export type OfferSource = ApiOffer["source"]
export type DiscountType = NonNullable<ApiOffer["discountType"]>
export type SortField = NonNullable<GetOffersParams["sortBy"]>
export type SortOrder = NonNullable<GetOffersParams["sortOrder"]>

/** next-intl translator instance */
export type Translator = ReturnType<typeof useTranslations>

// ─── Component prop types ────────────────────────────────────────────────────

export interface OfferFormProps {
  initialData?: ApiOffer | null
  isEditing?: boolean
  onSubmit: (data: CreateOfferInput | UpdateOfferInput) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}
