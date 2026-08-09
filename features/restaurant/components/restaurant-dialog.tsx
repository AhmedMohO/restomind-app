"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, Store, Upload, X } from "lucide-react"
import Image from "next/image"

import { restaurantSchema, type RestaurantInput } from "@/schemas/restaurant"
import { useZodResolver } from "@/lib/zod-locale"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { PaginatedUserSelect } from "@/features/users/components/paginated-user-select"
import {
  useAdminUpdateRestaurant,
  useCreateRestaurant,
} from "../hooks/use-restaurant"
import type { OwnerUserSummary, Restaurant } from "../types"
import { getErrorMessage } from "@/lib/api/utils"
import { getImageUrl } from "@/lib/utils"

interface RestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant?: Restaurant | null
}

function getOwnerId(owner?: string | OwnerUserSummary | null): string {
  if (!owner) return ""
  if (typeof owner === "object" && owner !== null) {
    return owner._id || ""
  }
  return String(owner)
}

export function RestaurantDialog({
  open,
  onOpenChange,
  restaurant,
}: RestaurantDialogProps) {
  const t = useTranslations("Dashboard.restaurant")

  const [addUserOpen, setAddUserOpen] = React.useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>(
    getOwnerId(restaurant?.ownerUserId)
  )
  const [imageFile, setImageFile] = React.useState<File | null>(null)

  const initialImageUrl = restaurant?.image?.secure_url || null

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    initialImageUrl
  )

  const createMutation = useCreateRestaurant()
  const updateMutation = useAdminUpdateRestaurant()
  const isEditing = !!restaurant

  const [prevOpen, setPrevOpen] = React.useState(open)
  const [prevRestaurant, setPrevRestaurant] = React.useState(restaurant)

  if (open !== prevOpen || restaurant !== prevRestaurant) {
    setPrevOpen(open)
    setPrevRestaurant(restaurant)
    if (open) {
      if (restaurant) {
        setSelectedOwnerId(getOwnerId(restaurant.ownerUserId))
        const imgUrl = restaurant.image?.secure_url || null
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith("blob:")) {
            URL.revokeObjectURL(prev)
          }
          return imgUrl
        })
        setImageFile(null)
      } else {
        setSelectedOwnerId("")
        setPreviewUrl((prev) => {
          if (prev && prev.startsWith("blob:")) {
            URL.revokeObjectURL(prev)
          }
          return null
        })
        setImageFile(null)
      }
    } else {
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      setImageFile(null)
    }
  }

  const formValues: RestaurantInput = React.useMemo(() => {
    if (!open) {
      return {
        name: "",
        description: "",
        phone: "",
        address: { street: "", city: "", country: "" },
        isActive: true,
      }
    }
    if (restaurant) {
      return {
        name: restaurant.name ?? "",
        description: restaurant.description ?? "",
        phone: restaurant.phone ?? "",
        address: {
          street: restaurant.address?.street ?? "",
          city: restaurant.address?.city ?? "",
          country: restaurant.address?.country ?? "",
        },
        isActive: restaurant.isActive ?? true,
      }
    }
    return {
      name: "",
      description: "",
      phone: "",
      address: { street: "", city: "", country: "" },
      isActive: true,
    }
  }, [open, restaurant])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    values: formValues,
  })

  const isPending = createMutation.isPending || updateMutation.isPending
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

  const resetImage = React.useCallback((url: string | null) => {
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return url
    })
    setImageFile(null)
  }, [])

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    resetImage(initialImageUrl)
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!isEditing && !selectedOwnerId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    const formData = new FormData()
    formData.append("name", values.name.trim())
    if (!isEditing && selectedOwnerId) {
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

    try {
      if (isEditing && restaurant) {
        await updateMutation.mutateAsync({
          id: restaurant._id,
          payload: formData,
        })
        toast.success(t("saveSuccess"))
      } else {
        await createMutation.mutateAsync(formData)
        toast.success(t("createSuccess"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[RestaurantDialog] submit failed", err)
      toast.error(
        getErrorMessage(err, isEditing ? t("saveError") : t("createError"))
      )
    }
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-xl rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg">
              <Store className="size-5 text-primary" />
              <span>
                {isEditing ? t("editRestaurant") : t("createRestaurant")}
              </span>
            </DialogTitle>
            <DialogDescription>{t("adminSubtitle")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={onSubmit}
            className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto px-1"
          >
            {/* Owner selection */}
            {!isEditing && (
              <Field>
                <FieldLabel>{t("selectOwner")}</FieldLabel>
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
            )}

            {/* Dropzone Image Field */}
            <div className="space-y-2">
              <FieldLabel>{t("imageLabel")}</FieldLabel>
              <div
                {...getRootProps()}
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                } ${isPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input {...getInputProps()} />
                {previewUrl ? (
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="relative size-24 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                      <Image
                        fill
                        src={getImageUrl(previewUrl)}
                        alt="Restaurant Preview"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-destructive-foreground absolute end-1 top-1 flex size-6 items-center justify-center rounded-full bg-destructive shadow-md transition-transform hover:scale-110"
                        title={t("removeImage")}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
                      {t("changeImageHint")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Upload className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        {isDragActive ? t("dropzoneActive") : t("uploadImage")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("dropzoneIdle")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
              <FieldLabel>{t("descLabel")}</FieldLabel>
              <Textarea
                {...register("description")}
                placeholder={t("descPlaceholder")}
                rows={3}
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3">
              <span className="text-sm font-medium">{t("isActiveLabel")}</span>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true, { shouldDirty: true })
                }
                disabled={isPending}
              />
            </div>

            <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
                  <span>{t("saveChanges")}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserCreated={(newUser) => {
          setSelectedOwnerId(newUser._id)
        }}
      />
    </>
  )
}
