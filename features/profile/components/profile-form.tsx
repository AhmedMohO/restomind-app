"use client"

import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Loader2, Save, User } from "lucide-react"

import { useZodResolver } from "@/lib/zod-locale"
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function ProfileForm({
  user,
  onSubmit,
  isSubmitting = false,
}: ProfileFormProps) {
  const t = useTranslations("Profile")
  const authT = useTranslations("Auth")

  // Format DOB (YYYY-MM-DD) for HTML date input
  const initialDOB = user.DOB
    ? new Date(user.DOB).toISOString().split("T")[0]
    : ""

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const selectedGender = useWatch({
    control,
    name: "gender",
  })

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
              <div className="relative">
                <Input
                  {...register("phone")}
                  placeholder={authT("phonePlaceholder")}
                  disabled={isSubmitting}
                />
              </div>
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
                  <SelectValue placeholder={t("genderSelect")} />
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
              <Input type="date" {...register("DOB")} disabled={isSubmitting} />
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
