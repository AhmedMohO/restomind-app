"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Save } from "lucide-react"

import { restaurantSchema, type RestaurantInput } from "@/schemas/restaurant"
import { useZodResolver } from "@/lib/zod-locale"
import { useUpdateRestaurant } from "../hooks/use-restaurant"
import type { Restaurant, UpdateRestaurantPayload } from "../types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RestaurantStatusBadge } from "./restaurant-status-badge"
import Image from "next/image"

interface RestaurantProfileFormProps {
  initialData: Restaurant
}

function buildDefaults(r: Restaurant): RestaurantInput {
  return {
    name: r.name ?? "",
    description: r.description ?? "",
    phone: r.phone ?? "",
    logoUrl: r.logoUrl ?? "",
    address: {
      street: r.address?.street ?? "",
      city: r.address?.city ?? "",
      country: r.address?.country ?? "",
    },
    isActive: r.isActive,
  }
}

export function RestaurantProfileForm({
  initialData,
}: RestaurantProfileFormProps) {
  const t = useTranslations("Dashboard.restaurant")
  const updateMutation = useUpdateRestaurant()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    defaultValues: buildDefaults(initialData),
  })

  // Re-sync when the parent passes a fresh initialData (e.g. refetch).
  React.useEffect(() => {
    reset(buildDefaults(initialData))
  }, [initialData, reset])

  // Live-watched values for char counter, logo preview, and the status badge.
  const description = useWatch({ control, name: "description" }) ?? ""
  const logoUrl = useWatch({ control, name: "logoUrl" }) ?? ""
  const isActive = useWatch({ control, name: "isActive" }) ?? false

  const isPending = updateMutation.isPending
  const descLength = description.length

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateRestaurantPayload = {
      name: values.name,
      description: values.description || null,
      phone: values.phone || null,
      logoUrl: values.logoUrl || null,
      address: {
        street: values.address?.street || undefined,
        city: values.address?.city || undefined,
        country: values.address?.country || undefined,
      },
      isActive: values.isActive,
    }

    try {
      const updated = await updateMutation.mutateAsync(payload)
      toast.success(t("saveSuccess"))
      // Clear isDirty by resetting to the just-saved state.
      if (updated) reset(buildDefaults(updated))
    } catch (err) {
      console.error("[restaurant-profile-form] PATCH failed", err)
      toast.error(t("saveError"))
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6 px-0 py-2 sm:px-4 sm:py-6">
      {/* Dirty warning */}
      {isDirty && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertDescription>{t("dirtyWarning")}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* ----------------- Basic info ----------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("sectionBasic")}
            </CardTitle>
            <CardDescription>{t("sectionBasicDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel>{t("nameLabel")}</FieldLabel>
              <Input
                {...register("name")}
                placeholder={t("namePlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.name}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <div className="flex items-center justify-between">
                <FieldLabel>{t("descLabel")}</FieldLabel>
                <span
                  className="text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  {t("descCounter", { count: descLength })}
                </span>
              </div>
              <Textarea
                {...register("description")}
                placeholder={t("descPlaceholder")}
                rows={4}
                maxLength={500}
                disabled={isPending}
                aria-invalid={!!errors.description}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field data-invalid={!!errors.phone}>
              <FieldLabel>{t("phoneLabel")}</FieldLabel>
              <Input
                {...register("phone")}
                placeholder={t("phonePlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.phone}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
          </CardContent>
        </Card>

        {/* ----------------- Logo & address ----------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("sectionLogo")}
            </CardTitle>
            <CardDescription>{t("sectionLogoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field data-invalid={!!errors.logoUrl}>
              <FieldLabel>{t("logoUrlLabel")}</FieldLabel>
              <Input
                {...register("logoUrl")}
                placeholder={t("logoUrlPlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.logoUrl}
              />
              <FieldError errors={[errors.logoUrl]} />
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo preview"
                  width={100}
                  height={100}
                  className="mt-2 rounded-xl"
                />
              ) : null}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field data-invalid={!!errors.address?.street}>
                <FieldLabel>{t("streetLabel")}</FieldLabel>
                <Input
                  {...register("address.street")}
                  placeholder={t("streetPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.street}
                />
                <FieldError errors={[errors.address?.street]} />
              </Field>

              <Field data-invalid={!!errors.address?.city}>
                <FieldLabel>{t("cityLabel")}</FieldLabel>
                <Input
                  {...register("address.city")}
                  placeholder={t("cityPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.city}
                />
                <FieldError errors={[errors.address?.city]} />
              </Field>

              <Field data-invalid={!!errors.address?.country}>
                <FieldLabel>{t("countryLabel")}</FieldLabel>
                <Input
                  {...register("address.country")}
                  placeholder={t("countryPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.country}
                />
                <FieldError errors={[errors.address?.country]} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ----------------- Status ----------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("sectionStatus")}
            </CardTitle>
            <CardDescription>{t("sectionStatusDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {getValues("name") || t("nameLabel")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("isActiveDesc")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <RestaurantStatusBadge isActive={isActive} />
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked === true, {
                      shouldDirty: true,
                    })
                  }
                  disabled={isPending}
                  aria-label={t("isActiveLabel")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit row */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="w-full gap-2 rounded-xl sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>{t("saveChanges")}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
