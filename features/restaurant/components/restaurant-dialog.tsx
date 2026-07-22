"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, Store } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { PaginatedUserSelect } from "@/features/users/components/paginated-user-select"
import {
  useAdminUpdateRestaurant,
  useCreateRestaurant,
} from "../hooks/use-restaurant"
import type { OwnerUserSummary, Restaurant } from "../types"

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

  const createMutation = useCreateRestaurant()
  const updateMutation = useAdminUpdateRestaurant()
  const isEditing = !!restaurant

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      logoUrl: "",
      address: { street: "", city: "", country: "" },
      isActive: true,
    },
  })

  const isActive = useWatch({ control, name: "isActive" }) ?? true

  React.useEffect(() => {
    if (restaurant) {
      reset({
        name: restaurant.name ?? "",
        description: restaurant.description ?? "",
        phone: restaurant.phone ?? "",
        logoUrl: restaurant.logoUrl ?? "",
        address: {
          street: restaurant.address?.street ?? "",
          city: restaurant.address?.city ?? "",
          country: restaurant.address?.country ?? "",
        },
        isActive: restaurant.isActive ?? true,
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOwnerId(getOwnerId(restaurant.ownerUserId))
    } else {
      reset({
        name: "",
        description: "",
        phone: "",
        logoUrl: "",
        address: { street: "", city: "", country: "" },
        isActive: true,
      })
      setSelectedOwnerId("")
    }
  }, [restaurant, reset, open])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedOwnerId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    try {
      if (isEditing && restaurant) {
        await updateMutation.mutateAsync({
          id: restaurant._id,
          payload: {
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
          },
        })
        toast.success(t("saveSuccess"))
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          ownerUserId: selectedOwnerId,
          description: values.description || undefined,
          phone: values.phone || undefined,
          logoUrl: values.logoUrl || undefined,
          address: {
            street: values.address?.street || undefined,
            city: values.address?.city || undefined,
            country: values.address?.country || undefined,
          },
        })
        toast.success(t("createSuccess"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[RestaurantDialog] submit failed", err)
      toast.error(isEditing ? t("saveError") : t("createError"))
    }
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-xl rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Store className="size-5 text-primary" />
              <span>
                {isEditing ? t("editRestaurant") : t("createRestaurant")}
              </span>
            </DialogTitle>
            <DialogDescription>{t("adminSubtitle")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Owner selection */}
            {!isEditing && (
              <Field>
                <FieldLabel>{t("selectOwner")}</FieldLabel>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <PaginatedUserSelect
                    value={selectedOwnerId}
                    onValueChange={(val) => setSelectedOwnerId(val)}
                    role="manager"
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
              <FieldLabel>{t("descLabel")}</FieldLabel>
              <Textarea
                {...register("description")}
                placeholder={t("descPlaceholder")}
                rows={3}
                disabled={isPending}
                aria-invalid={!!errors.description}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

              <Field data-invalid={!!errors.logoUrl}>
                <FieldLabel>{t("logoUrlLabel")}</FieldLabel>
                <Input
                  {...register("logoUrl")}
                  placeholder={t("logoUrlPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.logoUrl}
                />
                <FieldError errors={[errors.logoUrl]} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
