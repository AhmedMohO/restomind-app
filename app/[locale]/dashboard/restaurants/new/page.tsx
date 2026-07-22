"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Save, Store } from "lucide-react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { BackButton } from "@/components/ui/back-button"
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
import { CreateUserDialog } from "@/features/users/components/create-user-dialog"
import { PaginatedUserSelect } from "@/features/users/components/paginated-user-select"
import { useCreateRestaurant } from "@/features/restaurant/hooks/use-restaurant"
import { restaurantSchema, type RestaurantInput } from "@/schemas/restaurant"
import { useZodResolver } from "@/lib/zod-locale"
import { Link } from "@/i18n/routing"
export default function NewRestaurantPage() {
  const t = useTranslations("Dashboard.restaurant")
  const router = useRouter()

  const [addUserOpen, setAddUserOpen] = React.useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>("")

  const createMutation = useCreateRestaurant()

  const {
    register,
    handleSubmit,
    setValue,
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
  const isPending = createMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedOwnerId) {
      toast.error("Please select a restaurant owner / manager")
      return
    }

    try {
      await createMutation.mutateAsync({
        name: values.name,
        ownerUserId: selectedOwnerId,
        description: values.description || undefined,
        phone: values.phone || undefined,
        // logoUrl: values.logoUrl || undefined,
        address: {
          street: values.address?.street || undefined,
          city: values.address?.city || undefined,
          country: values.address?.country || undefined,
        },
      })
      toast.success(t("createSuccess"))
      router.push("/dashboard/restaurants")
    } catch (err) {
      console.error("[NewRestaurantPage] submit failed", err)
      toast.error(t("createError"))
    }
  })

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BackButton href="/dashboard/restaurants" />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-2xl font-bold">
                  {t("createRestaurant")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("adminSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Owner selection */}
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

            {/* Basic Information */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  {t("sectionBasic")}
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
                    <Input
                      {...register("phone")}
                      placeholder={t("phonePlaceholder")}
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
        </div>

        <CreateUserDialog
          open={addUserOpen}
          onOpenChange={setAddUserOpen}
          onUserCreated={(newUser) => {
            setSelectedOwnerId(newUser._id)
          }}
        />
      </main>
    </AppSidebar>
  )
}
