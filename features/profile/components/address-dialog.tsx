"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Loader2, Save, MapPin } from "lucide-react"

import { useZodResolver } from "@/lib/zod-locale"
import { addressSchema, type AddressInput } from "@/schemas/profile"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import type { UserAddress, AddressPayload } from "../api/profile"

interface AddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: UserAddress | null
  defaultUserName?: string
  defaultUserPhone?: string
  onSubmit: (data: AddressPayload) => Promise<void>
  isSubmitting?: boolean
}

export function AddressDialog({
  open,
  onOpenChange,
  initialData,
  defaultUserName = "",
  defaultUserPhone = "",
  onSubmit,
  isSubmitting = false,
}: AddressDialogProps) {
  const t = useTranslations("Profile")

  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: useZodResolver(addressSchema),
    defaultValues: {
      label: "",
      phoneNumber: defaultUserPhone,
      street: "",
      city: "",
      country: "",
      isDefault: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          label: initialData.label ?? "",
          phoneNumber: initialData.phoneNumber || defaultUserPhone,
          street: initialData.street ?? "",
          city: initialData.city ?? "",
          country: initialData.country ?? "",
          isDefault: initialData.isDefault ?? false,
        })
      } else {
        reset({
          label: "",
          phoneNumber: defaultUserPhone,
          street: "",
          city: "",
          country: "",
          isDefault: false,
        })
      }
    }
  }, [open, initialData, defaultUserName, defaultUserPhone, reset])

  const isDefaultChecked = useWatch({ control, name: "isDefault" })

  const handleFormSubmit = async (data: AddressInput) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <MapPin className="size-5 text-muted-foreground" />
            <span>{isEditing ? t("editAddress") : t("addAddress")}</span>
          </DialogTitle>
          <DialogDescription>{t("addressesDesc")}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-5 py-2"
        >
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {/* Address Label */}
            <Field className="sm:col-span-2">
              <FieldLabel>{t("addressLabel")}</FieldLabel>
              <Input
                {...register("label")}
                placeholder={t("addressLabelPlaceholder")}
                disabled={isSubmitting}
              />
            </Field>

            {/* Phone Number */}
            <Field className="sm:col-span-2">
              <FieldLabel>{t("phoneNumber")}</FieldLabel>
              <Input
                {...register("phoneNumber")}
                placeholder={t("phoneNumberPlaceholder")}
                disabled={isSubmitting}
              />
              {errors.phoneNumber && (
                <FieldError>{errors.phoneNumber.message}</FieldError>
              )}
            </Field>

            {/* Street Address */}
            <Field className="sm:col-span-2">
              <FieldLabel>{t("street")}</FieldLabel>
              <Input
                {...register("street")}
                placeholder={t("streetPlaceholder")}
                disabled={isSubmitting}
              />
              {errors.street && (
                <FieldError>{errors.street.message}</FieldError>
              )}
            </Field>

            {/* City */}
            <Field>
              <FieldLabel>{t("city")}</FieldLabel>
              <Input
                {...register("city")}
                placeholder={t("cityPlaceholder")}
                disabled={isSubmitting}
              />
              {errors.city && <FieldError>{errors.city.message}</FieldError>}
            </Field>

            {/* Country */}
            <Field>
              <FieldLabel>{t("country")}</FieldLabel>
              <Input
                {...register("country")}
                placeholder={t("countryPlaceholder")}
                disabled={isSubmitting}
              />
            </Field>

            {/* Set as Default Checkbox */}
            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
              <Checkbox
                id="isDefault"
                checked={!!isDefaultChecked}
                onCheckedChange={(checked) =>
                  setValue("isDefault", checked === true)
                }
                disabled={isSubmitting}
              />
              <label
                htmlFor="isDefault"
                className="cursor-pointer text-sm font-medium text-foreground select-none"
              >
                {t("setAsDefaultCheckbox")}
              </label>
            </div>
          </FieldGroup>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("addingAddress")}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>{t("saveAddress")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
