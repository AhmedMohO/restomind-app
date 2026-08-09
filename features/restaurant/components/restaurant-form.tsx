"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, Save, Store, Upload, X } from "lucide-react"
import Image from "next/image"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { PaginatedUserSelect } from "@/features/users/components/paginated-user-select"
import { restaurantSchema, type RestaurantInput } from "@/schemas/restaurant"
import { getImageUrl } from "@/lib/utils"
import type { Restaurant } from "../types"

export interface RestaurantFormProps {
  mode: "create" | "edit"
  restaurant?: Restaurant | null
  defaultValues?: Partial<RestaurantInput>
  onSubmit: (payload: FormData, ownerUserId?: string) => Promise<void> | void
  isPending?: boolean
}

export function RestaurantForm({
  mode,
  restaurant,
  defaultValues,
  onSubmit,
  isPending = false,
}: RestaurantFormProps) {
  const t = useTranslations("Dashboard.restaurant")

  const [addUserOpen, setAddUserOpen] = React.useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>("")
  const [imageFile, setImageFile] = React.useState<File | null>(null)

  const initialImageUrl = restaurant?.image?.secure_url || null

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    initialImageUrl
  )

  const [prevRestaurant, setPrevRestaurant] = React.useState(restaurant)
  const [prevDefaultValues, setPrevDefaultValues] = React.useState(defaultValues)

  if (restaurant !== prevRestaurant || defaultValues !== prevDefaultValues) {
    setPrevRestaurant(restaurant)
    setPrevDefaultValues(defaultValues)
    const imgUrl = restaurant?.image?.secure_url || null
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return imgUrl
    })
    setImageFile(null)
  }

  const formDefaults: RestaurantInput = React.useMemo(
    () => ({
      name: restaurant?.name ?? defaultValues?.name ?? "",
      description: restaurant?.description ?? defaultValues?.description ?? "",
      phone: restaurant?.phone ?? defaultValues?.phone ?? "",
      address: {
        street:
          restaurant?.address?.street ?? defaultValues?.address?.street ?? "",
        city: restaurant?.address?.city ?? defaultValues?.address?.city ?? "",
        country:
          restaurant?.address?.country ?? defaultValues?.address?.country ?? "",
      },
      isActive: restaurant?.isActive ?? defaultValues?.isActive ?? true,
    }),
    [restaurant, defaultValues]
  )

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    values: formDefaults,
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

  const isActive = useWatch({ control, name: "isActive" }) ?? true
  const selectedPhone = useWatch({ control, name: "phone" })

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

  const handleFormSubmit = handleSubmit(async (values) => {
    if (mode === "create" && !selectedOwnerId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    const formData = new FormData()
    formData.append("name", values.name.trim())
    if (mode === "create" && selectedOwnerId) {
      formData.append("ownerUserId", selectedOwnerId)
    }
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
    formData.append("isActive", String(values.isActive ?? true))

    if (imageFile) {
      formData.append("image", imageFile)
    }

    await onSubmit(formData, mode === "create" ? selectedOwnerId : undefined)
  })

  return (
    <>
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        {/* Owner selection (create mode only) */}
        {mode === "create" && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Store className="size-5 text-primary" />
                <span>{t("selectOwner")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <PaginatedUserSelect
                    value={selectedOwnerId}
                    onValueChange={(val) => setSelectedOwnerId(val)}
                    role="manager"
                    unassignedOnly
                    disabled={isPending}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1 rounded-xl"
                    onClick={() => setAddUserOpen(true)}
                  >
                    <Plus className="size-4" />
                    <span>{t("addUser")}</span>
                  </Button>
                </div>
              </Field>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Store className="size-5 text-primary" />
              <span>{t("sectionBasic")}</span>
            </CardTitle>
            <CardDescription>{t("sectionBasicDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>

            <Field data-invalid={!!errors.description}>
              <FieldLabel>{t("descLabel")}</FieldLabel>
              <Textarea
                {...register("description")}
                placeholder={t("descPlaceholder")}
                rows={4}
                disabled={isPending}
                aria-invalid={!!errors.description}
                className="rounded-xl"
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </CardContent>
        </Card>

        {/* Image Dropzone & Address */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
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
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragActive
                    ? "scale-[1.01] border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                } ${isPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input {...getInputProps()} />
                {previewUrl ? (
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="relative size-32 overflow-hidden rounded-2xl border border-border bg-muted shadow-md">
                      <Image
                        fill
                        src={getImageUrl(previewUrl)}
                        alt="Restaurant Preview"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-destructive-foreground absolute end-2 top-2 flex size-7 items-center justify-center rounded-full bg-destructive shadow-md transition-transform hover:scale-110"
                        title={t("removeImage")}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
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

            {/* Address fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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

        {/* Status */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {t("isActiveLabel")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("isActiveDesc")}
                </span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, {
                    shouldDirty: true,
                  })
                }
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/restaurants" />}
            disabled={isPending}
            className="w-full rounded-xl sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
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

      {mode === "create" && (
        <CreateUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onUserCreated={(newUser) => {
            setSelectedOwnerId(newUser._id)
          }}
        />
      )}
    </>
  )
}
