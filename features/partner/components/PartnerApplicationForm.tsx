"use client"

import React, { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  partnerApplicationSchema,
  type PartnerApplicationInput,
} from "@/schemas/partner"
import { Link } from "@/i18n/routing"
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Store,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Globe,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Clock,
  Check,
  Search,
  FileEdit,
} from "lucide-react"

import { useSubmitPartnershipApplication } from "../hooks/use-partnership"
import { PartnershipStatusCheck } from "./PartnershipStatusCheck"

const INITIAL_FORM: PartnerApplicationInput = {
  restaurantName: "",
  businessType: "",
  ownerFirstName: "",
  ownerLastName: "",
  email: "",
  phone: "",
  city: "",
  district: "",
  commercialReg: "",
  socialLink: "",
  notes: "",
}

const STORAGE_KEY = "restomind_partner_app_state"

// Which registered field names live on which step. Used to decide whether a
// step has been "attempted" (Continue/Submit clicked) so we know it's safe
// to surface its errors.
const STEP_FIELDS: Record<number, (keyof PartnerApplicationInput)[]> = {
  1: ["restaurantName", "businessType"],
  2: ["ownerFirstName", "ownerLastName", "email", "phone"],
  3: ["city", "district", "socialLink", "notes"],
}

export default function PartnerApplicationForm() {
  const t = useTranslations("PartnerApplication")

  const [activeTab, setActiveTab] = useState<"apply" | "status">("apply")
  const [step, setStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [referenceId, setReferenceId] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)

  // Tracks which steps the user has actually tried to advance past (Continue
  // or final Submit). Errors for a step only render once it's been attempted
  // OR the specific field has been touched — this is what stops Step 3's
  // "required" messages from showing up before the user ever lands there.
  const [stepAttempted, setStepAttempted] = useState<Record<number, boolean>>(
    {}
  )

  const submitMutation = useSubmitPartnershipApplication()

  const form = useForm<PartnerApplicationInput>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: INITIAL_FORM,
    mode: "onTouched",
  })

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors, touchedFields },
  } = form

  const formData = useWatch({ control: form.control })

  // Restore step and form state from localStorage on page refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (
            typeof parsed.step === "number" &&
            parsed.step >= 1 &&
            parsed.step <= 3
          ) {
            setStep(parsed.step)
          }
          if (parsed.formData) {
            reset(parsed.formData)
          }
          if (parsed.isSubmitted) {
            setIsSubmitted(parsed.isSubmitted)
          }
          if (parsed.referenceId) {
            setReferenceId(parsed.referenceId)
          }
        }
      } catch {
        // ignore parse errors
      } finally {
        setIsLoaded(true)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [reset])

  // Save current step and form state to localStorage (only while in progress)
  useEffect(() => {
    if (!isLoaded || isSubmitted) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, formData, isSubmitted, referenceId })
      )
    } catch {
      // ignore storage errors
    }
  }, [step, formData, isSubmitted, referenceId, isLoaded])

  // Small helper: is it OK to show an error for this field right now?
  // Either the user touched it directly, or they tried to leave/submit the
  // step it belongs to (Continue/Submit was clicked at least once).
  const canShowError = (field: keyof PartnerApplicationInput) => {
    if (touchedFields[field]) return true
    const owningStep = Object.entries(STEP_FIELDS).find(([, fields]) =>
      fields.includes(field)
    )?.[0]
    return owningStep ? !!stepAttempted[Number(owningStep)] : false
  }

  const markStepAttempted = (s: number) =>
    setStepAttempted((prev) => (prev[s] ? prev : { ...prev, [s]: true }))

  const handleNext = async () => {
    // Mark first so an invalid attempt still reveals its own errors.
    markStepAttempted(step)

    let isValid = false
    if (step === 1) {
      isValid = await trigger(STEP_FIELDS[1])
    } else if (step === 2) {
      isValid = await trigger(STEP_FIELDS[2])
    }
    if (isValid) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1)
    }
  }

  const onSubmit = async (data: PartnerApplicationInput) => {
    setIsSubmitting(true)
    try {
      const res = await submitMutation.mutateAsync({
        businessName: data.restaurantName,
        businessType: data.businessType,
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        district: data.district,
        commercialRegistration: data.commercialReg,
        website: data.socialLink,
        notes: data.notes,
      })

      const app = res?.application
      setReferenceId(
        app?._id ||
          `RM-PARTNER-${Math.floor(100000 + Math.random() * 900000)}`
      )
      setIsSubmitted(true)

      // Clear local storage upon submission completion
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }

      toast.success(
        res?.message || "Partnership application submitted successfully."
      )
    } catch (err) {
      console.error("[PartnerApplicationForm] submit failed", err)
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit application. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Wrap RHF's handleSubmit so a failed final submit also marks step 3 as
  // "attempted" — otherwise a submit with empty step-3 fields wouldn't show
  // any error at all (since those fields were never touched or trigger()'d).
  const onFormSubmit = handleSubmit(onSubmit, () => {
    markStepAttempted(3)
  })

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher: Apply vs Check Status */}
      <div className="mx-auto flex max-w-md items-center justify-center rounded-2xl bg-stone-200/60 p-1.5 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("apply")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all",
            activeTab === "apply"
              ? "bg-white text-[#7C4A27] shadow-sm dark:bg-neutral-900 dark:text-[#E68A49]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileEdit className="size-4" />
          <span>{t("applyTabTitle") || "Submit Application"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all",
            activeTab === "status"
              ? "bg-white text-[#7C4A27] shadow-sm dark:bg-neutral-900 dark:text-[#E68A49]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="size-4" />
          <span>{t("statusTabTitle") || "Check Status"}</span>
        </button>
      </div>

      {activeTab === "status" ? (
        <PartnershipStatusCheck />
      ) : isSubmitted ? (
        <Card className="mx-auto w-full max-w-3xl rounded-3xl border border-stone-200/80 bg-white p-6 text-center shadow-xl sm:p-10 dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="space-y-8 p-0">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="size-10" />
            </div>

            <div className="space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-600/20 bg-emerald-500/10 px-4 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase dark:bg-emerald-500/20 dark:text-emerald-400"
              >
                <Sparkles className="me-1.5 inline size-3.5" />
                <span>Under Review</span>
              </Badge>

              <h2 className="font-serif text-3xl font-bold text-[#2B1B15] dark:text-stone-100">
                {t("successTitle")}
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("successSubtitle")}
              </p>
            </div>

            {/* Reference ID Box */}
            <div className="inline-flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#7C4A27]/30 bg-[#7C4A27]/5 px-6 py-4 dark:border-[#C2733C]/30 dark:bg-[#C2733C]/10">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t("refIdLabel")}
              </span>
              <span className="font-mono text-xl font-extrabold text-[#7C4A27] dark:text-[#E68A49]">
                {referenceId}
              </span>
            </div>

            {/* 3 Step Review Process Roadmap */}
            <div className="space-y-4 text-left rtl:text-right">
              <h4 className="font-serif text-base font-bold text-[#2B1B15] dark:text-stone-200">
                {t("whatHappensNext")}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="flex flex-col gap-2 rounded-2xl border border-stone-200/60 bg-stone-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7C4A27] dark:text-[#E68A49]">
                    <Clock className="size-4 shrink-0" />
                    <span>{t("reviewStep1")}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("reviewStep1Desc")}
                  </p>
                </Card>

                <Card className="flex flex-col gap-2 rounded-2xl border border-stone-200/60 bg-stone-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7C4A27] dark:text-[#E68A49]">
                    <Phone className="size-4 shrink-0" />
                    <span>{t("reviewStep2")}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("reviewStep2Desc")}
                  </p>
                </Card>

                <Card className="flex flex-col gap-2 rounded-2xl border border-stone-200/60 bg-stone-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>{t("reviewStep3")}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("reviewStep3Desc")}
                  </p>
                </Card>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("status")}
                className="h-auto rounded-full px-6 py-3 text-sm font-semibold gap-2"
              >
                <Search className="size-4" />
                <span>{t("checkStatusBtn") || "Check Status"}</span>
              </Button>
              <Link
                href="/offers"
                className={cn(
                  buttonVariants(),
                  "h-auto rounded-full bg-[#7C4A27] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                )}
              >
                <span>{t("viewOffers")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-3xl rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-xl md:p-10 dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="space-y-8 p-0">
            {/* Stepper Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <span
                  className={step >= 1 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""}
                >
                  1. {t("step1Title")}
                </span>
                <span
                  className={step >= 2 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""}
                >
                  2. {t("step2Title")}
                </span>
                <span
                  className={step >= 3 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""}
                >
                  3. {t("step3Title")}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-[#7C4A27] to-[#C2733C] transition-all duration-500 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={onFormSubmit} className="space-y-6">
              {/* STEP 1: Business Profile */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200/80 pb-4 dark:border-neutral-800">
                    <CardTitle className="font-serif text-xl font-bold text-[#2B1B15] dark:text-stone-100">
                      {t("step1Title")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {t("step1Desc")}
                    </CardDescription>
                  </div>

                  {/* Restaurant Name */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Store className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("restaurantName")} *</span>
                    </Label>
                    <Input
                      type="text"
                      {...register("restaurantName")}
                      placeholder={t("restaurantNamePlaceholder")}
                      className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                    />
                    {errors.restaurantName?.message &&
                      canShowError("restaurantName") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(
                            errors.restaurantName.message as Parameters<
                              typeof t
                            >[0]
                          )}
                        </p>
                      )}
                  </div>

                  {/* Business Type with shadcn Select */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("businessType")} *</span>
                    </Label>
                    <Select
                      value={formData?.businessType || ""}
                      onValueChange={(val) => {
                        if (val) {
                          setValue("businessType", val, { shouldValidate: true })
                        }
                      }}
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 text-sm text-stone-900 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-stone-100">
                        <SelectValue placeholder={t("selectBusinessType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">
                          {t("typeRestaurant")}
                        </SelectItem>
                        <SelectItem value="bakery">{t("typeBakery")}</SelectItem>
                        <SelectItem value="cafe">{t("typeCafe")}</SelectItem>
                        <SelectItem value="catering">
                          {t("typeCatering")}
                        </SelectItem>
                        <SelectItem value="supermarket">
                          {t("typeSupermarket")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.businessType?.message &&
                      canShowError("businessType") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(
                            errors.businessType.message as Parameters<
                              typeof t
                            >[0]
                          )}
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* STEP 2: Contact Info */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200/80 pb-4 dark:border-neutral-800">
                    <CardTitle className="font-serif text-xl font-bold text-[#2B1B15] dark:text-stone-100">
                      {t("step2Title")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {t("step2Desc")}
                    </CardDescription>
                  </div>

                  {/* Owner First & Last Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("ownerFirstName")} *</span>
                      </Label>
                      <Input
                        type="text"
                        {...register("ownerFirstName")}
                        placeholder={t("ownerFirstNamePlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                      />
                      {errors.ownerFirstName?.message &&
                        canShowError("ownerFirstName") && (
                          <p className="text-xs font-medium text-red-500">
                            {t(
                              errors.ownerFirstName.message as Parameters<
                                typeof t
                              >[0]
                            )}
                          </p>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("ownerLastName")} *</span>
                      </Label>
                      <Input
                        type="text"
                        {...register("ownerLastName")}
                        placeholder={t("ownerLastNamePlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                      />
                      {errors.ownerLastName?.message &&
                        canShowError("ownerLastName") && (
                          <p className="text-xs font-medium text-red-500">
                            {t(
                              errors.ownerLastName.message as Parameters<
                                typeof t
                              >[0]
                            )}
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("email")} *</span>
                      </Label>
                      <Input
                        type="email"
                        {...register("email")}
                        placeholder={t("emailPlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                      />
                      {errors.email?.message && canShowError("email") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(errors.email.message as Parameters<typeof t>[0])}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("phone")} *</span>
                      </Label>
                      <PhoneInput
                        name="phone"
                        value={formData?.phone || ""}
                        onValueChange={(val) => {
                          setValue("phone", val, { shouldValidate: true })
                        }}
                        placeholder={t("phonePlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone?.message && canShowError("phone") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(errors.phone.message as Parameters<typeof t>[0])}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Commercial Registration / Tax ID */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("commercialReg")}</span>
                    </Label>
                    <Input
                      type="text"
                      {...register("commercialReg")}
                      placeholder={t("commercialRegPlaceholder")}
                      className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Operations & Location */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200/80 pb-4 dark:border-neutral-800">
                    <CardTitle className="font-serif text-xl font-bold text-[#2B1B15] dark:text-stone-100">
                      {t("step3Title")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {t("step3Desc")}
                    </CardDescription>
                  </div>

                  {/* City & District */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("city")} *</span>
                      </Label>
                      <Input
                        type="text"
                        {...register("city")}
                        placeholder={t("cityPlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                      />
                      {errors.city?.message && canShowError("city") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(errors.city.message as Parameters<typeof t>[0])}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                        <span>{t("district")} *</span>
                      </Label>
                      <Input
                        type="text"
                        {...register("district")}
                        placeholder={t("districtPlaceholder")}
                        className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                      />
                      {errors.district?.message && canShowError("district") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(
                            errors.district.message as Parameters<typeof t>[0]
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social Link */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("socialLink")}</span>
                    </Label>
                    <Input
                      type="url"
                      {...register("socialLink")}
                      placeholder={t("socialLinkPlaceholder")}
                      className="h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                    />
                    {errors.socialLink?.message &&
                      canShowError("socialLink") && (
                        <p className="text-xs font-medium text-red-500">
                          {t(
                            errors.socialLink.message as Parameters<typeof t>[0]
                          )}
                        </p>
                      )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("notes")}</span>
                    </Label>
                    <Textarea
                      {...register("notes")}
                      rows={3}
                      placeholder={t("notesPlaceholder")}
                      className="rounded-xl border-stone-200 bg-stone-50/50 p-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-6 dark:border-neutral-800">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-auto rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                    <span>Back</span>
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-auto rounded-xl bg-[#7C4A27] px-6 py-3 text-sm font-semibold text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
                  >
                    <span>Continue</span>
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-auto rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    {isSubmitting ? (
                      <span>{t("submitting")}</span>
                    ) : (
                      <>
                        <span>{t("submitButton")}</span>
                        <Check className="size-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}