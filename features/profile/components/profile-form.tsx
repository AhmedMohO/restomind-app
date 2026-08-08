"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { CalendarIcon, Loader2, Save, User } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { useZodResolver } from "@/lib/zod-locale"
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FullUser } from "../api/profile"

interface ProfileFormProps {
  user: FullUser
  onSubmit: (data: UpdateProfileInput) => Promise<void>
  isSubmitting?: boolean
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.split("T")[0].split("-")
  if (parts.length !== 3) return undefined
  const [y, m, d] = parts.map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined
  return new Date(y, m - 1, d)
}

export function ProfileForm({
  user,
  onSubmit,
  isSubmitting = false,
}: ProfileFormProps) {
  const t = useTranslations("Profile")
  const authT = useTranslations("Auth")

  // Format DOB (YYYY-MM-DD) for initial value
  const initialDOB = user.DOB
    ? new Date(user.DOB).toISOString().split("T")[0]
    : ""

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: useZodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? undefined,
      DOB: initialDOB,
    },
  })

  React.useEffect(() => {
    reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? undefined,
      DOB: user.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    })
  }, [user, reset])

  const selectedPhone = useWatch({
    control,
    name: "phone",
  })

  const selectedGender = useWatch({
    control,
    name: "gender",
  })

  const selectedDOB = useWatch({
    control,
    name: "DOB",
  })

  const selectedDate = parseLocalDate(selectedDOB)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-xl">
          <User className="size-5 text-muted-foreground" />
          <span>{t("personalDetails")}</span>
        </CardTitle>
        <CardDescription>{t("personalDetailsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="grid gap-6 sm:grid-cols-2">
            {/* First Name */}
            <Field>
              <FieldLabel>{authT("firstNameLabel")}</FieldLabel>
              <Input
                {...register("firstName")}
                placeholder={authT("firstNamePlaceholder")}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <FieldError>{errors.firstName.message}</FieldError>
              )}
            </Field>

            {/* Last Name */}
            <Field>
              <FieldLabel>{authT("lastNameLabel")}</FieldLabel>
              <Input
                {...register("lastName")}
                placeholder={authT("lastNamePlaceholder")}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <FieldError>{errors.lastName.message}</FieldError>
              )}
            </Field>

            {/* Email (Read-Only) */}
            <Field>
              <FieldLabel>{authT("emailLabel")}</FieldLabel>
              <Input
                value={user.email}
                disabled
                readOnly
                className="opacity-70"
              />
            </Field>

            {/* Phone */}
            <Field>
              <FieldLabel>{authT("phoneLabel")}</FieldLabel>
              <PhoneInput
                value={selectedPhone}
                {...register("phone")}
                disabled={isSubmitting}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>

            {/* Gender */}
            <Field>
              <FieldLabel>{t("genderLabel")}</FieldLabel>
              <Select
                value={selectedGender ?? ""}
                onValueChange={(val) =>
                  setValue(
                    "gender",
                    val === "male" || val === "female" ? val : null,
                    {
                      shouldDirty: true,
                    }
                  )
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("genderSelect")}>
                    {selectedGender === "male"
                      ? t("male")
                      : selectedGender === "female"
                      ? t("female")
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("male")}</SelectItem>
                  <SelectItem value="female">{t("female")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* DOB */}
            <Field>
              <FieldLabel>{t("dobLabel")}</FieldLabel>
              <DatePicker
                value={selectedDOB}
                placeholder={t("pickDate")}
                maxDate={new Date()}
                allowFuture={false}
                onChange={(val) =>
                  setValue("DOB", val ?? null, { shouldDirty: true })
                }
                disabled={isSubmitting}
              />
              {errors.DOB && <FieldError>{errors.DOB.message}</FieldError>}
            </Field>
          </FieldGroup>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="gap-2 rounded-xl"
            >
              {isSubmitting ? (
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
      </CardContent>
    </Card>
  )
}
