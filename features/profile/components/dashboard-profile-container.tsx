"use client"

import { useState, useEffect } from "react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useForm, Controller, useWatch } from "react-hook-form"
import {
  Upload,
  Trash2,
  Info,
  Loader2,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Package,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useMySubscription } from "@/features/subscription/hooks/use-subscription"
import { daysUntil } from "@/features/subscription/api/type"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
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
import { getErrorMessage } from "@/lib/api/utils"
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/profile"
import { useProfile, useUpdateProfile } from "../hooks/use-profile"
import type { FullUser } from "../api/profile"

interface DashboardProfileContainerProps {
  initialUser?: FullUser
}
export function DashboardProfileContainer({
  initialUser,
}: DashboardProfileContainerProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.account")
  const tVal = useTranslations("Validation")

  const { data: subscription, isLoading: isSubLoading } = useMySubscription()

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  // Fetch / sync user data using TanStack Query
  const { data: queryUser, isLoading: isProfileLoading } =
    useProfile(initialUser)
  const user = queryUser ?? initialUser
  const updateProfileMutation = useUpdateProfile()

  const isPending = updateProfileMutation.isPending

  // React Hook Form initialized with request-isolated locale-aware Zod resolver
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: useZodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      gender: (user?.gender as "male" | "female") || undefined,
      DOB: user?.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    },
  })

  // Synchronize form when user data updates
  useEffect(() => {
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      gender: (user?.gender as "male" | "female") || undefined,
      DOB: user?.DOB ? new Date(user.DOB).toISOString().split("T")[0] : "",
    })
  }, [user, reset])

  const selectedPhone = useWatch({
    control,
    name: "phone",
  })
  const selectedDOB = useWatch({
    control,
    name: "DOB",
  })
  const getInitials = (first?: string, last?: string) => {
    const f = first?.[0]?.toUpperCase() ?? ""
    const l = last?.[0]?.toUpperCase() ?? ""
    return f + l || "U"
  }

  if (isProfileLoading && !user) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null
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
        toast.error(getErrorMessage(err, "Failed to update avatar"))
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
        toast.error(getErrorMessage(err, "Failed to update profile"))
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
                <PhoneInput
                  id="phone"
                  value={selectedPhone}
                  {...register("phone")}
                />
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
                        <SelectValue placeholder={t("selectGender")}>
                          {field.value === "male"
                            ? t("genderMale")
                            : field.value === "female"
                            ? t("genderFemale")
                            : undefined}
                        </SelectValue>
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
                <DatePicker
                  value={selectedDOB}
                  placeholder={t("dob")}
                  maxDate={new Date()}
                  allowFuture={false}
                  onChange={(val) =>
                    setValue("DOB", val ?? null, { shouldDirty: true })
                  }
                  disabled={isPending}
                />
                {errors.DOB?.message && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tVal(errors.DOB.message)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* ---------------- Section 3: Subscription & Plan ---------------- */}
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {t("subscriptionTitle")}
                </h3>
                <p className="mt-0.5 text-xs font-normal text-muted-foreground/90 sm:text-sm">
                  {t("subscriptionDesc")}
                </p>
              </div>

              <Link href={`/${locale}/dashboard/billing`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-xl border-primary/20 bg-primary/5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <CreditCard className="size-4" />
                  <span>{t("manageBilling")}</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            {isSubLoading ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : subscription ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Current Tier & Status */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-4 transition-all hover:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("currentPlan")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        subscription.state === "active"
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : subscription.state === "trial"
                            ? "border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : subscription.state === "grace"
                              ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {subscription.state}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-lg font-bold capitalize text-foreground">
                      {subscription.tier ? `${subscription.tier} tier` : "Free Trial"}
                    </span>
                  </div>
                </div>

                {/* Renewal / Expiry Date */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-4 transition-all hover:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {subscription.state === "trial"
                        ? t("trialEndsAt")
                        : t("renewalDate")}
                    </span>
                    {(() => {
                      const dateStr =
                        subscription.state === "trial"
                          ? subscription.trialEndsAt
                          : subscription.currentPeriodEnd
                      const days = daysUntil(dateStr)
                      if (days === null) return null
                      return (
                        <span className="text-[10px] font-semibold text-primary">
                          {t("daysRemaining", { days: Math.max(0, days) })}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {(() => {
                        const dateStr =
                          subscription.state === "trial"
                            ? subscription.trialEndsAt
                            : subscription.currentPeriodEnd
                        if (!dateStr) return "—"
                        try {
                          return new Date(dateStr).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        } catch {
                          return dateStr
                        }
                      })()}
                    </span>
                  </div>
                </div>

                {/* Product Usage */}
                <div className="rounded-xl border border-border/60 bg-background/60 p-4 transition-all hover:border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("productUsage")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {subscription.productCap !== null
                        ? t("productsUsed", {
                            count: subscription.productCount,
                            cap: subscription.productCap,
                          })
                        : t("unlimitedProducts", {
                            count: subscription.productCount,
                          })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                {t("noSubscription")}
              </div>
            )}
          </div>

          <Separator className="bg-border/60" />

          {/* ---------------- Action Footer Bar ---------------- */}
          <div className="flex flex-col items-center justify-between gap-4 pt-1 sm:flex-row sm:pt-2">
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetForm}
                disabled={!isDirty || isPending}
                className="h-10 flex-1 rounded-xl border-border/80 px-5 text-xs font-semibold transition-all hover:bg-accent sm:flex-none sm:text-sm"
              >
                {t("reset")}
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isPending}
                className="h-10 flex-1 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:flex-none sm:text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="me-2 size-3.5 animate-spin" />
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
