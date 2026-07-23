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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const activeLocale = useLocale()
  const dateLocale = activeLocale === "ar" ? ar : enUS

  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  // Format DOB (YYYY-MM-DD) for initial value
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
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  className={cn(
                    "flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <span>
                    {selectedDate
                      ? format(selectedDate, "PPP", { locale: dateLocale })
                      : t("pickDate")}
                  </span>
                  <CalendarIcon className="size-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue("DOB", format(date, "yyyy-MM-dd"), {
                          shouldDirty: true,
                        })
                      } else {
                        setValue("DOB", null, { shouldDirty: true })
                      }
                      setIsCalendarOpen(false)
                    }}
                    captionLayout="dropdown"
                    startMonth={new Date(1930, 0)}
                    endMonth={new Date()}
                    disabled={(date) =>
                      date > new Date() || date < new Date(1900, 0)
                    }
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
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
