"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"
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
import { PhoneInput } from "@/components/ui/phone-input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateUser } from "../hooks/use-users"
import type { ApiUser } from "../api"
import { createUserSchema, type CreateUserInput } from "@/schemas/user"
import { getErrorMessage } from "@/lib/api/utils"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated?: (user: ApiUser) => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserDialogProps) {
  const t = useTranslations("Dashboard.restaurant")
  const createUserMutation = useCreateUser()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: useZodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      gender: "" as "male" | "female",
      DOB: "",
    },
  })

  const currentRole = useWatch({ control, name: "role" }) ?? "manager"
  const currentGender = useWatch({ control, name: "gender" }) ?? undefined
  const currentDOB = useWatch({ control, name: "DOB" }) ?? undefined
  const isPending = createUserMutation.isPending

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const newUser = await createUserMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        role: values.role,
        gender: values.gender,
        DOB: values.DOB,
      })
      toast.success(t("userCreatedSuccess"))
      if (onUserCreated && newUser) {
        onUserCreated(newUser)
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[CreateUserDialog] create failed", err)
      toast.error(getErrorMessage(err, t("userCreatedError")))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="size-5 text-primary" />
            <span>{t("addUserDialogTitle")}</span>
          </DialogTitle>
          <DialogDescription>{t("addUserDialogDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel>{t("userFirstNameLabel")}</FieldLabel>
              <Input
                {...register("firstName")}
                placeholder="John"
                disabled={isPending}
                aria-invalid={!!errors.firstName}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel>{t("userLastNameLabel")}</FieldLabel>
              <Input
                {...register("lastName")}
                placeholder="Doe"
                disabled={isPending}
                aria-invalid={!!errors.lastName}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>
          </div>

          <Field data-invalid={!!errors.email}>
            <FieldLabel>{t("userEmailLabel")}</FieldLabel>
            <Input
              {...register("email")}
              type="email"
              placeholder="manager@example.com"
              disabled={isPending}
              aria-invalid={!!errors.email}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel>{t("userPasswordLabel")}</FieldLabel>
            <Input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!errors.password}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel>{t("userPhoneLabel")}</FieldLabel>
            <PhoneInput
              {...register("phone")}
              disabled={isPending}
              aria-invalid={!!errors.phone}
            />
            <FieldError errors={[errors.phone]} />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={!!errors.gender}>
              <FieldLabel>Gender</FieldLabel>
              <Select
                value={currentGender ?? ""}
                onValueChange={(val) =>
                  setValue("gender", val as "male" | "female", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.gender]} />
            </Field>

            <Field data-invalid={!!errors.DOB}>
              <FieldLabel>{t("dob")}</FieldLabel>
              <DatePicker
                value={currentDOB}
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

          <Field>
            <FieldLabel>{t("userRoleLabel")}</FieldLabel>
            <Select
              value={currentRole}
              onValueChange={(val) =>
                setValue(
                  "role",
                  (val as "admin" | "manager" | "customer") ?? "manager"
                )
              }
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectRolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">{t("roleManager")}</SelectItem>
                <SelectItem value="admin">{t("roleAdmin")}</SelectItem>
                <SelectItem value="customer">{t("roleCustomer")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl"
            >
              {t("userCancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("userCreateBtn")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
