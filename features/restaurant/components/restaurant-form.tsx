"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, Save, Store } from "lucide-react"

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
import { useZodResolver } from "@/lib/zod-locale"
import { Link } from "@/i18n/routing"

export interface RestaurantFormProps {
  mode: "create" | "edit"
  defaultValues?: Partial<RestaurantInput>
  onSubmit: (
    values: RestaurantInput,
    ownerUserId?: string
  ) => Promise<void> | void
  isPending?: boolean
}

export function RestaurantForm({
  mode,
  defaultValues,
  onSubmit,
  isPending = false,
}: RestaurantFormProps) {
  const t = useTranslations("Dashboard.restaurant")

  const [addUserOpen, setAddUserOpen] = React.useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>("")

  const formDefaults: RestaurantInput = {
    name: defaultValues?.name ?? "",
    description: defaultValues?.description ?? "",
    phone: defaultValues?.phone ?? "",
    logoUrl: defaultValues?.logoUrl ?? "",
    address: {
      street: defaultValues?.address?.street ?? "",
      city: defaultValues?.address?.city ?? "",
      country: defaultValues?.address?.country ?? "",
    },
    isActive: defaultValues?.isActive ?? true,
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<RestaurantInput>({
    resolver: useZodResolver(restaurantSchema),
    defaultValues: formDefaults,
  })

  React.useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name ?? "",
        description: defaultValues.description ?? "",
        phone: defaultValues.phone ?? "",
        logoUrl: defaultValues.logoUrl ?? "",
        address: {
          street: defaultValues.address?.street ?? "",
          city: defaultValues.address?.city ?? "",
          country: defaultValues.address?.country ?? "",
        },
        isActive: defaultValues.isActive ?? true,
      })
    }
  }, [defaultValues, reset])

  const isActive = useWatch({ control, name: "isActive" }) ?? true
  const selectedPhone = useWatch({ control, name: "phone" })

  const handleFormSubmit = handleSubmit(async (values) => {
    if (mode === "create" && !selectedOwnerId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }
    await onSubmit(values, mode === "create" ? selectedOwnerId : undefined)
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
              />
              <FieldError errors={[errors.description]} />
            </Field>
          </CardContent>
        </Card>

        {/* Logo and Address */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {t("sectionLogo")}
            </CardTitle>
            <CardDescription>{t("sectionLogoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <span className="text-sm font-medium">
                {t("isActiveLabel")}
              </span>
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

        {/* Submit */}
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
