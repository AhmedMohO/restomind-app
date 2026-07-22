"use client"

import * as React from "react"
import { use } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save, User } from "lucide-react"

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
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUserById, useUpdateUser } from "@/features/users/hooks/use-users"
import { updateUserSchema, type UpdateUserInput } from "@/schemas/user"
import { useZodResolver } from "@/lib/zod-locale"
import { Link } from "@/i18n/routing"
import { getErrorMessage } from "@/lib/api/utils"

export default function EditUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("Dashboard.users")
  const router = useRouter()
  const { data: user, isLoading, isError } = useUserById(id)
  const updateMutation = useUpdateUser()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: useZodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      role: "customer",
    },
  })

  React.useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "customer",
        gender: user.gender ?? undefined,
        DOB: user.DOB ?? undefined,
      })
    }
  }, [user, reset])

  const selectedRole = useWatch({ control, name: "role" }) ?? "customer"
  const selectedGender = useWatch({ control, name: "gender" }) ?? ""
  const selectedDOB = useWatch({ control, name: "DOB" }) ?? undefined
  const isPending = updateMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          role: values.role,
          gender: values.gender || undefined,
          DOB: values.DOB || undefined,
        },
      })
      toast.success(t("updateSuccess"))
      router.push("/dashboard/users")
    } catch (err) {
      console.error("[EditUserPage] submit failed", err)
      toast.error(getErrorMessage(err, t("updateError")))
    }
  })

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BackButton href="/dashboard/users" />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-2xl font-bold">
                  {t("editUser")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("editUserSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 w-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : isError || !user ? (
            <Card className="rounded-2xl p-8 text-center">
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("userFetchError")}
                </p>
                <Button
                  variant="outline"
                  render={<Link href="/dashboard/users" />}
                  className="mt-4 rounded-xl"
                >
                  {t("backToList")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              {/* Basic Information */}
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

                  <Field data-invalid={!!errors.phone}>
                    <FieldLabel>{t("phone")}</FieldLabel>
                    <Input
                      {...register("phone")}
                      placeholder={t("phonePlaceholder")}
                      disabled={isPending}
                      aria-invalid={!!errors.phone}
                    />
                    <FieldError errors={[errors.phone]} />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field data-invalid={!!errors.gender}>
                      <FieldLabel>{t("gender")}</FieldLabel>
                      <Select
                        value={selectedGender}
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
                        value={selectedDOB}
                        onChange={(val) => setValue("DOB", val, { shouldDirty: true, shouldValidate: true })}
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
                        if (val) setValue("role", val as "admin" | "manager" | "customer", { shouldValidate: true })
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder={t("roleSelectPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">{t("roleCustomer")}</SelectItem>
                        <SelectItem value="manager">{t("roleManager")}</SelectItem>
                        <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[errors.role]} />
                  </Field>
                </CardContent>
              </Card>

              {/* Submit */}
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
                      <span>{t("saveChanges")}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </AppSidebar>
  )
}
