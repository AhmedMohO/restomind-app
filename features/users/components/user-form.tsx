"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Loader2, Save, User } from "lucide-react"

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
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createUserSchema,
  updateUserSchema,
} from "@/schemas/user"
import { useZodResolver } from "@/lib/zod-locale"
import { Link } from "@/i18n/routing"

import { useAuthStore } from "@/features/auth/store/useAuthStore"

export interface UserFormValues {
  firstName: string
  lastName: string
  email?: string
  password?: string
  phone: string
  role: "admin" | "manager" | "customer" | "staff"
  gender?: "male" | "female" | null
  DOB?: string | null
}

export interface UserFormProps {
  mode: "create" | "edit"
  defaultValues?: Partial<UserFormValues>
  onSubmit: (values: UserFormValues) => Promise<void> | void
  isPending?: boolean
}

export function UserForm({
  mode,
  defaultValues,
  onSubmit,
  isPending = false,
}: UserFormProps) {
  const t = useTranslations("Dashboard.users")
  const currentUserRole = useAuthStore((s) => s.user?.role)

  const formResolver = useZodResolver(
    mode === "create" ? createUserSchema : updateUserSchema
  )

  const formDefaults: UserFormValues = {
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    password: defaultValues?.password ?? "",
    phone: defaultValues?.phone ?? "",
    role: defaultValues?.role ?? "customer",
    gender: defaultValues?.gender ?? null,
    DOB: defaultValues?.DOB ?? null,
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: formResolver,
    defaultValues: formDefaults,
  })

  React.useEffect(() => {
    if (defaultValues) {
      reset({
        firstName: defaultValues.firstName ?? "",
        lastName: defaultValues.lastName ?? "",
        email: defaultValues.email ?? "",
        password: defaultValues.password ?? "",
        phone: defaultValues.phone ?? "",
        role: defaultValues.role ?? "customer",
        gender: defaultValues.gender ?? null,
        DOB: defaultValues.DOB ?? null,
      })
    }
  }, [defaultValues, reset])

  const selectedRole = useWatch({ control, name: "role" }) ?? "customer"
  const selectedGender = useWatch({ control, name: "gender" }) ?? ""
  const selectedDOB = useWatch({ control, name: "DOB" }) ?? undefined

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      {/* Personal Details */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <User className="size-5 text-primary" />
            <span>{t("sectionPersonal")}</span>
          </CardTitle>
          <CardDescription>{t("sectionPersonalDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel>{t("firstName")}</FieldLabel>
              <Input
                {...register("firstName")}
                placeholder={t("firstNamePlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.firstName}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel>{t("lastName")}</FieldLabel>
              <Input
                {...register("lastName")}
                placeholder={t("lastNamePlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.lastName}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "create" ? (
              <Field data-invalid={!!errors.email}>
                <FieldLabel>{t("email")}</FieldLabel>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder={t("emailPlaceholder")}
                  disabled={isPending}
                  aria-invalid={!!errors.email}
                />
                <FieldError errors={[errors.email]} />
              </Field>
            ) : (
              <Field>
                <FieldLabel>{t("email")}</FieldLabel>
                <Input
                  type="email"
                  value={defaultValues?.email ?? ""}
                  disabled
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </Field>
            )}

            <Field data-invalid={!!errors.phone}>
              <FieldLabel>{t("phone")}</FieldLabel>
              <PhoneInput
                {...register("phone")}
                disabled={isPending}
                aria-invalid={!!errors.phone}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
          </div>

          {mode === "create" && (
            <Field data-invalid={!!errors.password}>
              <FieldLabel>{t("password")}</FieldLabel>
              <Input
                type="password"
                {...register("password")}
                placeholder={t("passwordPlaceholder")}
                disabled={isPending}
                aria-invalid={!!errors.password}
              />
              <FieldError errors={[errors.password]} />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.gender}>
              <FieldLabel>{t("gender")}</FieldLabel>
              <Select
                value={selectedGender ?? ""}
                onValueChange={(val) =>
                  setValue("gender", val ? (val as "male" | "female") : null)
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t("selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("male")}</SelectItem>
                  <SelectItem value="female">{t("female")}</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.gender]} />
            </Field>

            <Field data-invalid={!!errors.DOB}>
              <FieldLabel>{t("dob")}</FieldLabel>
              <DatePicker
                value={selectedDOB ?? undefined}
                onChange={(val) =>
                  setValue("DOB", val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              />
              <FieldError errors={[errors.DOB]} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Role & Permissions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            {t("sectionRole")}
          </CardTitle>
          <CardDescription>{t("sectionRoleDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field data-invalid={!!errors.role}>
            <FieldLabel>{t("role")}</FieldLabel>
            <Select
              value={selectedRole}
              onValueChange={(val) => {
                if (val)
                  setValue("role", val as UserFormValues["role"], {
                    shouldValidate: true,
                  })
              }}
              disabled={isPending}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder={t("roleSelectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">{t("roleCustomer")}</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                {currentUserRole !== "manager" && (
                  <>
                    <SelectItem value="manager">{t("roleManager")}</SelectItem>
                    <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.role]} />
          </Field>
        </CardContent>
      </Card>

      {/* Submit Bar */}
      <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/users" />}
          disabled={isPending}
          className="w-full rounded-xl sm:w-auto"
        >
          {t("cancelBtn")}
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
              <span>{mode === "create" ? t("createUser") : t("saveChanges")}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
