"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useForm, Controller, useWatch } from "react-hook-form"
import { Upload, Trash2, Info, Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useZodResolver } from "@/lib/zod-locale"
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/profile"
import { useProfile, useUpdateProfile } from "../hooks/use-profile"
import type { FullUser } from "../api/profile"

interface DashboardProfileContainerProps {
  initialUser: FullUser
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.split("T")[0].split("-")
  if (parts.length !== 3) return undefined
  const [y, m, d] = parts.map(Number)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined
  return new Date(y, m - 1, d)
}

export function DashboardProfileContainer({
  initialUser,
}: DashboardProfileContainerProps) {
  const t = useTranslations("Dashboard.account")
  const tVal = useTranslations("Validation")
  const activeLocale = useLocale()
  const dateLocale = activeLocale === "ar" ? ar : enUS

  // Fetch / sync user data using TanStack Query
  const { data: queryUser } = useProfile(initialUser)
  const user = queryUser ?? initialUser
  const updateProfileMutation = useUpdateProfile()
  const isPending = updateProfileMutation.isPending

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // React Hook Form initialized with request-isolated locale-aware Zod resolver
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: useZodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      gender: (user.gender as "male" | "female") || undefined,
      DOB: user.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    },
  })

  // Synchronize form when user data updates
  useEffect(() => {
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      gender: (user.gender as "male" | "female") || undefined,
      DOB: user.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    })
  }, [user, reset])

  const selectedDOB = useWatch({
    control,
    name: "DOB",
  })
  const selectedDate = parseLocalDate(selectedDOB)

  const getInitials = (first?: string, last?: string) => {
    const f = first?.[0]?.toUpperCase() ?? ""
    const l = last?.[0]?.toUpperCase() ?? ""
    return f + l || "U"
  }

  // Handle Avatar Upload via TanStack Query mutation
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append("image", file)

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        setIsUploadingAvatar(false)
        toast.success("Profile picture updated successfully")
      },
      onError: (err) => {
        setIsUploadingAvatar(false)
        toast.error(err.message || "Failed to update avatar")
      },
    })
  }

  // Reset form to initial values
  const handleResetForm = () => {
    reset({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      gender: (user.gender as "male" | "female") || undefined,
      DOB: user.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    })
    toast.info(t("reset"))
  }

  // Submit valid form data via TanStack Query mutation
  const onSubmit = (data: UpdateProfileInput) => {
    const formData = new FormData()
    if (data.firstName !== user.firstName)
      formData.append("firstName", data.firstName)
    if (data.lastName !== user.lastName)
      formData.append("lastName", data.lastName)
    if (data.phone !== (user.phone ?? "")) {
      if (data.phone) formData.append("phone", data.phone)
    }
    if (data.gender !== (user.gender ?? undefined)) {
      if (data.gender) formData.append("gender", data.gender)
    }

    const initialDOB = user.DOB
      ? new Date(user.DOB).toISOString().split("T")[0]
      : ""
    if (data.DOB !== initialDOB) {
      if (data.DOB) formData.append("DOB", data.DOB)
    }

    if ([...formData.keys()].length === 0) {
      toast.info(t("saveChanges"))
      return
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        toast.success(t("saveChanges"))
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update profile")
      },
    })
  }

  return (
    <TooltipProvider>
      <div className="rounded-2xl border border-border/70 bg-card p-4 transition-all sm:p-6 md:p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-8"
        >
          {/* ---------------- Section 1: Profile Picture ---------------- */}
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Avatar className="size-16 shrink-0 rounded-full border-2 border-border/80 sm:size-20">
                <AvatarImage
                  key={user.image?.secure_url || "avatar"}
                  src={user.image?.secure_url}
                  alt={user.firstName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {t("profilePicture")}
                </h3>
                <p className="text-xs font-normal text-muted-foreground/90 sm:text-sm">
                  {t("profilePictureDesc")}
                </p>

                <div className="flex items-center gap-2.5 pt-2">
                  <label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isUploadingAvatar}
                      className="h-8.5 cursor-pointer gap-1.5 rounded-lg bg-secondary px-3.5 text-xs font-semibold shadow-2xs transition-colors hover:bg-secondary/80"
                      onClick={() =>
                        document.getElementById("avatar-upload-input")?.click()
                      }
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Upload className="size-3.5" />
                      )}
                      <span>{t("upload")}</span>
                    </Button>
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8.5 rounded-lg text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                    onClick={() => toast.info(t("remove"))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* ---------------- Section 2: Basic Details ---------------- */}
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {t("basicDetails")}
              </h3>
              <p className="mt-0.5 text-xs font-normal text-muted-foreground/90 sm:text-sm">
                {t("basicDetailsDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {/* First Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("firstName")}
                </Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder={t("firstName")}
                  className="h-10 rounded-xl border-input/80 bg-background/50 text-xs transition-all focus-visible:ring-1 focus-visible:ring-primary/40 sm:text-sm"
                />
                {errors.firstName?.message && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tVal(errors.firstName.message)}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("lastName")}
                </Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder={t("lastName")}
                  className="h-10 rounded-xl border-input/80 bg-background/50 text-xs transition-all focus-visible:ring-1 focus-visible:ring-primary/40 sm:text-sm"
                />
                {errors.lastName?.message && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tVal(errors.lastName.message)}
                  </p>
                )}
              </div>

              {/* Primary Email Address (Read-only) */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-foreground/90 sm:text-sm"
                  >
                    {t("primaryEmail")}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger type="button" tabIndex={-1}>
                      <Info className="size-3.5 cursor-help text-muted-foreground/70 transition-colors hover:text-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-medium">
                      Primary email associated with your account
                    </TooltipContent>
                  </Tooltip>

                  <span className="inline-flex items-center rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:text-xs dark:text-emerald-400">
                    {t("verified")}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <Input
                    id="email"
                    value={user.email}
                    readOnly
                    className="h-10 cursor-not-allowed rounded-xl border-input/80 bg-muted/30 text-xs font-medium text-muted-foreground sm:text-sm"
                  />
                </div>
                <p className="text-[11px] leading-relaxed font-normal text-muted-foreground/80 sm:text-xs">
                  {t("emailNotice")}
                </p>
              </div>

              {/* System Role (Read-only) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="role"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("role")}
                </Label>
                <Input
                  id="role"
                  value={
                    user.role === "admin"
                      ? "System Administrator"
                      : user.role === "manager"
                        ? "Restaurant Manager"
                        : "Customer"
                  }
                  readOnly
                  className="h-10 cursor-not-allowed rounded-xl border-input/80 bg-muted/30 text-xs font-semibold text-muted-foreground capitalize sm:text-sm"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="phone"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("phone")}
                </Label>
                <PhoneInput id="phone" {...register("phone")} />
                {errors.phone?.message && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tVal(errors.phone.message)}
                  </p>
                )}
                <p className="text-[11px] leading-relaxed font-normal text-muted-foreground/80 sm:text-xs">
                  {t("phoneNotice")}
                </p>
              </div>

              {/* Gender Select */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="gender"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("gender")}
                </Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl border-input/80 bg-background/50 text-xs font-medium sm:text-sm">
                        <SelectValue placeholder={t("selectGender")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("genderMale")}</SelectItem>
                        <SelectItem value="female">
                          {t("genderFemale")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Date of Birth — Shadcn Calendar taking all grid columns */}
              <div className="w-full space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="DOB"
                  className="text-xs font-semibold text-foreground/90 sm:text-sm"
                >
                  {t("dob")}
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger
                    className={cn(
                      "flex h-10 w-full items-center justify-between rounded-xl border border-input/80 bg-background/50 px-3 py-2 text-xs font-medium shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
                      !selectedDate && "text-muted-foreground"
                    )}
                    disabled={isPending}
                  >
                    <span>
                      {selectedDate
                        ? format(selectedDate, "PPP", { locale: dateLocale })
                        : t("dob")}
                    </span>
                    <CalendarIcon className="size-4 opacity-60" />
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
                {errors.DOB?.message && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tVal(errors.DOB.message)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* ---------------- Action Footer Bar ---------------- */}
          <div className="flex flex-col items-center justify-between gap-4 pt-1 sm:flex-row sm:pt-2">
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                className="h-10 flex-1 rounded-xl border-border/80 px-5 text-xs font-semibold transition-all hover:bg-accent sm:flex-none sm:text-sm"
              >
                {t("reset")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 flex-1 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:flex-none sm:text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <span>{t("saveChanges")}</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}
