"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Mail, ShieldCheck, Loader2, Save, User, Briefcase, Store } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUserSchema, updateUserSchema } from "@/schemas/user"
import { useZodResolver } from "@/lib/zod-locale"
import { Link } from "@/i18n/routing"

import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"

export interface UserFormValues {
  firstName: string
  lastName: string
  email: string
  password?: string
  phone: string
  role: "admin" | "manager" | "customer" | "staff"
  restaurantId?: string | null
  gender?: "male" | "female"
  DOB?: string
  employeeCode?: string
  department?: string
  hireDate?: string
  notes?: string
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
  const isManager = currentUserRole === "manager"

  const formResolver = useZodResolver(
    mode === "create" ? createUserSchema : updateUserSchema
  )

  const formDefaults: UserFormValues = {
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    password: defaultValues?.password ?? "",
    phone: defaultValues?.phone ?? "",
    role: isManager ? "staff" : (defaultValues?.role ?? "customer"),
    restaurantId: defaultValues?.restaurantId ?? null,
    gender: defaultValues?.gender ?? "male",
    DOB: defaultValues?.DOB ?? "",
    employeeCode: defaultValues?.employeeCode ?? "",
    department: defaultValues?.department ?? "",
    notes: defaultValues?.notes ?? "",
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
        role: isManager ? "staff" : (defaultValues.role ?? "customer"),
        restaurantId: defaultValues.restaurantId ?? null,
        gender: defaultValues.gender,
        DOB: defaultValues.DOB,
        employeeCode: defaultValues.employeeCode ?? "",
        department: defaultValues.department ?? "",
        notes: defaultValues.notes ?? "",
      })
    } else if (isManager) {
      setValue("role", "staff")
    }
  }, [defaultValues, isManager, reset, setValue])

  const selectedRole = useWatch({ control, name: "role" }) ?? (isManager ? "staff" : "customer")
  const selectedRestaurantId = useWatch({ control, name: "restaurantId" })
  const selectedPhone = useWatch({ control, name: "phone" })
  const selectedGender = useWatch({ control, name: "gender" }) ?? ""
  const selectedDOB = useWatch({ control, name: "DOB" }) ?? undefined

  const isStaffTarget = selectedRole === "staff"

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      {/* Invitation banner for staff creation */}
      {mode === "create" && isStaffTarget && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-200">
          <Mail className="size-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <p className="font-semibold">
              {t("staffInviteNoticeTitle") || "Account Setup Email Will Be Sent"}
            </p>
            <p className="text-xs text-blue-700/90 dark:text-blue-300/90">
              {t("staffInviteNoticeDesc") ||
                "No password is required. The staff member will receive an email invitation with a secure link to activate their account and set their password."}
            </p>
          </div>
        </div>
      )}

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
                  className="cursor-not-allowed bg-muted text-muted-foreground"
                />
              </Field>
            )}

            <Field data-invalid={!!errors.phone}>
              <FieldLabel>{t("phone")}</FieldLabel>
              <PhoneInput
                value={selectedPhone}
                {...register("phone")}
                disabled={isPending}
                aria-invalid={!!errors.phone}
              />
              <FieldError errors={[errors.phone]} />
            </Field>
          </div>

          {mode === "create" && !isStaffTarget && (
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
                value={selectedGender}
                onValueChange={(val) => setValue("gender", val as "male" | "female")}
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
                value={selectedDOB}
                maxDate={new Date()}
                allowFuture={false}
                onChange={(val) =>
                  setValue("DOB", val ?? "", {
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

      {/* Staff Employment Metadata Section */}
      {(isStaffTarget || isManager) && (
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Briefcase className="size-5 text-primary" />
              <span>{t("sectionStaffDetails") || "Staff Employment Details"}</span>
            </CardTitle>
            <CardDescription>
              {t("sectionStaffDetailsDesc") ||
                "Configure staff employee code, assigned operational department, and notes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field data-invalid={!!errors.employeeCode}>
                <FieldLabel>{t("employeeCode") || "Employee Code"}</FieldLabel>
                <Input
                  {...register("employeeCode")}
                  placeholder={t("employeeCodePlaceholder") || "e.g. EMP-101"}
                  disabled={isPending}
                />
                <FieldError errors={[errors.employeeCode]} />
              </Field>

              <Field data-invalid={!!errors.department}>
                <FieldLabel>{t("department") || "Department"}</FieldLabel>
                <Input
                  {...register("department")}
                  placeholder={t("departmentPlaceholder") || "e.g. Kitchen / Prep"}
                  disabled={isPending}
                />
                <FieldError errors={[errors.department]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.notes}>
              <FieldLabel>{t("notes") || "Notes / Duties"}</FieldLabel>
              <Textarea
                {...register("notes")}
                placeholder={t("notesPlaceholder") || "Night shift prep lead..."}
                disabled={isPending}
                rows={3}
                className="rounded-xl"
              />
              <FieldError errors={[errors.notes]} />
            </Field>
          </CardContent>
        </Card>
      )}

      {/* Role & Permissions */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <ShieldCheck className="size-5 text-primary" />
            <span>{t("sectionRole")}</span>
          </CardTitle>
          <CardDescription>{t("sectionRoleDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field data-invalid={!!errors.role}>
            <FieldLabel>{t("role")}</FieldLabel>
            <Select
              value={selectedRole}
              onValueChange={(val) => {
                if (val && !isManager)
                  setValue("role", val as UserFormValues["role"], {
                    shouldValidate: true,
                  })
              }}
              disabled={isPending || isManager}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder={t("roleSelectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {isManager ? (
                  <SelectItem value="staff">{t("roleStaff")}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="customer">{t("roleCustomer")}</SelectItem>
                    <SelectItem value="staff">{t("roleStaff")}</SelectItem>
                    <SelectItem value="manager">{t("roleManager")}</SelectItem>
                    <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.role]} />
          </Field>

          {/* Restaurant Assignment for Admin creating/editing Staff or Manager */}
          {!isManager && (isStaffTarget || selectedRole === "manager") && (
            <Field data-invalid={!!errors.restaurantId}>
              <FieldLabel>{t("restaurant") || "Assigned Restaurant"}</FieldLabel>
              <PaginatedRestaurantSelect
                id="restaurantId"
                value={selectedRestaurantId ?? ""}
                onValueChange={(val) => {
                  setValue("restaurantId", val || null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                disabled={isPending}
              />
              <FieldError errors={[errors.restaurantId]} />
            </Field>
          )}
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
              <span>
                {mode === "create"
                  ? isStaffTarget
                    ? t("addStaff") || "Send Staff Invitation"
                    : t("createUser")
                  : t("saveChanges")}
              </span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

