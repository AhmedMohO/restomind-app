"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { useRouter } from "@/i18n/routing"
import { OfferForm } from "./offer-form"
import { useCreateOffer, useOfferById, useUpdateOffer } from "@/features/offers/hooks/use-offers"
import type { CreateOfferInput, UpdateOfferInput } from "@/features/offers/api/type"
import { getErrorMessage } from "@/lib/api/utils"

interface OfferFormPageProps {
  offerId?: string
}

export function OfferFormPage({ offerId }: OfferFormPageProps) {
  const router = useRouter()
  const t = useTranslations("Dashboard.offers")
  const isEditing = Boolean(offerId)

  const { data: offer, isLoading: isFetching, isError } = useOfferById(offerId ?? null)

  const createMutation = useCreateOffer()
  const updateMutation = useUpdateOffer()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (data: CreateOfferInput | UpdateOfferInput) => {
    try {
      if (isEditing && offerId) {
        await updateMutation.mutateAsync({ id: offerId, data: data as UpdateOfferInput })
        toast.success(t("updateSuccess"))
      } else {
        await createMutation.mutateAsync(data as CreateOfferInput)
        toast.success(t("createSuccess"))
      }
      router.push("/dashboard/offers")
    } catch (err) {
      console.error("[OfferFormPage] Form submit failed", err)
      const defaultMsg = isEditing ? t("updateError") : t("createError")
      toast.error(getErrorMessage(err, defaultMsg))
    }
  }

  if (isEditing && isFetching) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isEditing && (isError || !offer)) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("detailFetchError")}</p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/offers")}
          className="rounded-xl"
        >
          {t("backToList")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <BackButton href="/dashboard/offers" />
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {isEditing ? t("editOffer") : t("createOffer")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? t("formPageSubtitleEdit") : t("formPageSubtitleCreate")}
          </p>
        </div>
      </div>

      {/* Reusable Form */}
      <OfferForm
        initialData={offer}
        isEditing={isEditing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.push("/dashboard/offers")}
      />
    </div>
  )
}
