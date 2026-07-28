"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Save, Upload, X } from "lucide-react"

import { restaurantSchema, type RestaurantInput } from "@/schemas/restaurant"
import { useZodResolver } from "@/lib/zod-locale"
import { useUpdateRestaurant } from "../hooks/use-restaurant"
import type { Restaurant } from "../types"

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
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { getErrorMessage } from "@/lib/api/utils"

interface RestaurantProfileFormProps {
  initialData: Restaurant
}

function buildDefaults(r: Restaurant): RestaurantInput {
  return {
    name: r.name ?? "",
    description: r.description ?? "",
    phone: r.phone ?? "",
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

  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const initialImageUrl = initialData.image?.secure_url || null
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialImageUrl)

  const [prevInitialData, setPrevInitialData] = React.useState(initialData)

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
    const imgUrl = initialData.image?.secure_url || null
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return imgUrl
    })
    setImageFile(null)
  }

  const formValues = React.useMemo(
    () => buildDefaults(initialData),
    [initialData]
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    values: formValues,
  })

  const resetImage = React.useCallback((url: string | null) => {
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return url
    })
    setImageFile(null)
  }, [])

  const description = useWatch({ control, name: "description" }) ?? ""
  const selectedPhone = useWatch({ control, name: "phone" })

  const isPending = updateMutation.isPending
  const descLength = description.length

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(file)
    })
    setImageFile(file)
  }, [])

  const onDropRejected = React.useCallback(() => {
    toast.error(t("invalidImageError"))
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isPending,
  })

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    resetImage(initialImageUrl)
  }

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData()
    formData.append("name", values.name.trim())
    if (values.description) {
      formData.append("description", values.description.trim())
    }
    if (values.phone) {
      formData.append("phone", values.phone.trim())
    }
    if (values.address?.street) {
      formData.append("address[street]", values.address.street.trim())
    }
    if (values.address?.city) {
      formData.append("address[city]", values.address.city.trim())
    }
    if (values.address?.country) {
      formData.append("address[country]", values.address.country.trim())
    }

    if (imageFile) {
      formData.append("image", imageFile)
    }

    try {
      const updated = await updateMutation.mutateAsync(formData)
      toast.success(t("saveSuccess"))
      if (updated) {
        reset(buildDefaults(updated))
        resetImage(updated.image?.secure_url || null)
      }
    } catch (err) {
      console.error("[restaurant-profile-form] PATCH failed", err)
      toast.error(getErrorMessage(err, t("saveError")))
    }
  })

  const isFormModified = isDirty || imageFile !== null

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Dirty warning */}
      {isFormModified && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertDescription>{t("dirtyWarning")}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* ----------------- Basic info ----------------- */}
        <Card className="rounded-2xl">
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
                className="rounded-xl"
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
                className="rounded-xl"
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field data-invalid={!!errors.phone}>
              <FieldLabel>{t("phoneLabel")}</FieldLabel>
              <PhoneInput
                value={selectedPhone}
                {...register("phone")}
                disabled={isPending}
                aria-invalid={!!errors.phone}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
          </CardContent>
        </Card>

        {/* ----------------- Logo & address ----------------- */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t("sectionLogo")}
            </CardTitle>
            <CardDescription>{t("sectionLogoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Image Dropzone */}
            <div className="space-y-2">
              <FieldLabel>{t("imageLabel")}</FieldLabel>
              <div
                {...getRootProps()}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input {...getInputProps()} />
                {previewUrl ? (
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="relative size-32 overflow-hidden rounded-2xl border border-border bg-muted shadow-md">
                      <Image
                        fill
                        src={previewUrl}
                        alt="Logo preview"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 end-2 flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110"
                        title={t("removeImage")}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {t("changeImageHint")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Upload className="size-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {isDragActive ? t("dropzoneActive") : t("uploadImage")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("dropzoneIdle")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field data-invalid={!!errors.address?.street}>
                <FieldLabel>{t("streetLabel")}</FieldLabel>
                <Input
                  {...register("address.street")}
                  placeholder={t("streetPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.street}
                  className="rounded-xl"
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
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
                <FieldError errors={[errors.address?.country]} />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Submit row */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !isFormModified}
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
