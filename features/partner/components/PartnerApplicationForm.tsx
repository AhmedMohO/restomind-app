"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  partnerStep1Schema,
  partnerStep2Schema,
  partnerStep3Schema,
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
  Loader2,
} from "lucide-react"

import { useSubmitPartnershipApplication } from "../hooks/use-partnership"
import { PartnershipStatusCheck } from "./PartnershipStatusCheck"

const stepSchemas = {
  1: partnerStep1Schema,
  2: partnerStep2Schema,
  3: partnerStep3Schema,
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PartnerApplicationForm() {
  const t = useTranslations("PartnerApplication")
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<"apply" | "status">(
    () => (searchParams.get("tab") === "status" ? "status" : "apply")
  )

  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam === "status") {
      setActiveTab("status")
    } else if (tabParam === "apply") {
      setActiveTab("apply")
    }
  }, [searchParams])

  const [step, setStep] = useState<number>(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [referenceId, setReferenceId] = useState("")

  const submitMutation = useSubmitPartnershipApplication()

  const form = useForm<PartnerApplicationInput>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
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
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  })

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = form

  const formData = useWatch({ control: form.control })

  const handleNext = useCallback(async () => {
    const schema = stepSchemas[step as keyof typeof stepSchemas]
    const fieldsToValidate = Object.keys(
      schema.shape
    ) as (keyof PartnerApplicationInput)[]

    const valid = await trigger(fieldsToValidate, { shouldFocus: true })
    if (valid) setStep((prev) => prev + 1)
  }, [step, trigger])

  const handleBack = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1))
  }, [])

  const onSubmit = async (data: PartnerApplicationInput) => {
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
        app?._id || `RM-PARTNER-${Math.floor(100000 + Math.random() * 900000)}`
      )
      setIsSubmitted(true)

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
    }
  }

  const fieldError = (name: keyof PartnerApplicationInput) => {
    const msg = errors[name]?.message
    if (!msg) return null
    return (
      <p role="alert" className="mt-1 text-xs font-medium text-red-500">
        {t(msg as any)}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher */}
      <div className="mx-auto flex max-w-md items-center justify-center rounded-2xl bg-stone-200/60 p-1.5 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("apply")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm",
            activeTab === "apply"
              ? "bg-white text-[#7C4A27] shadow-sm dark:bg-neutral-900 dark:text-[#E68A49]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileEdit className="size-4" />
          <span>{t("applyTabTitle")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm",
            activeTab === "status"
              ? "bg-white text-[#7C4A27] shadow-sm dark:bg-neutral-900 dark:text-[#E68A49]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="size-4" />
          <span>{t("statusTabTitle")}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {activeTab === "status" ? (
        <PartnershipStatusCheck />
      ) : isSubmitted ? (
        /* ---- SUCCESS SCREEN ---- */
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
                <span>{t("underReview")}</span>
              </Badge>

              <h2 className="font-serif text-3xl font-bold text-[#2B1B15] dark:text-stone-100">
                {t("successTitle")}
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("successSubtitle")}
              </p>
            </div>

            {/* Reference ID */}
            <div className="inline-flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#7C4A27]/30 bg-[#7C4A27]/5 px-6 py-4 dark:border-[#C2733C]/30 dark:bg-[#C2733C]/10">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t("refIdLabel")}
              </span>
              <span className="font-mono text-xl font-extrabold text-[#7C4A27] dark:text-[#E68A49]">
                {referenceId}
              </span>
            </div>

            {/* What happens next */}
            <div className="space-y-4 text-start">
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

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("status")}
                className="h-auto gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <Search className="size-4" />
                <span>{t("checkStatusBtn")}</span>
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
        /* ---- MULTI-STEP FORM ---- */
        <Card className="mx-auto w-full max-w-3xl rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-xl md:p-10 dark:border-neutral-800 dark:bg-neutral-900">
          <CardContent className="space-y-8 p-0">
            {/* Stepper */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <span
                  className={
                    step >= 1 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""
                  }
                >
                  1. {t("step1Title")}
                </span>
                <span
                  className={
                    step >= 2 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""
                  }
                >
                  2. {t("step2Title")}
                </span>
                <span
                  className={
                    step >= 3 ? "text-[#7C4A27] dark:text-[#E68A49]" : ""
                  }
                >
                  3. {t("step3Title")}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-[#7C4A27] to-[#C2733C] transition-all duration-500 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-6"
            >
              {/* ---- STEP 1: Business Profile ---- */}
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
                      aria-invalid={!!errors.restaurantName}
                      className={cn(
                        "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                        errors.restaurantName &&
                          "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                      )}
                    />
                    {fieldError("restaurantName")}
                  </div>

                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                      <span>{t("businessType")} *</span>
                    </Label>
                    <Select
                      value={formData?.businessType || ""}
                      onValueChange={(val) => {
                        if (val) {
                          setValue("businessType", val, {
                            shouldValidate: true,
                            shouldTouch: true,
                          })
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-invalid={!!errors.businessType}
                        className={cn(
                          "h-12 w-full rounded-xl border bg-stone-50/50 px-3.5 text-sm text-stone-900 dark:bg-neutral-800/50 dark:text-stone-100",
                          errors.businessType
                            ? "border-red-500 focus:ring-red-500 dark:border-red-500"
                            : "border-stone-200 dark:border-neutral-700"
                        )}
                      >
                        <SelectValue placeholder={t("selectBusinessType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">
                          {t("typeRestaurant")}
                        </SelectItem>
                        <SelectItem value="bakery">
                          {t("typeBakery")}
                        </SelectItem>
                        <SelectItem value="cafe">{t("typeCafe")}</SelectItem>
                        <SelectItem value="catering">
                          {t("typeCatering")}
                        </SelectItem>
                        <SelectItem value="supermarket">
                          {t("typeSupermarket")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldError("businessType")}
                  </div>
                </div>
              )}

              {/* ---- STEP 2: Contact Info ---- */}
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
                        aria-invalid={!!errors.ownerFirstName}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.ownerFirstName &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("ownerFirstName")}
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
                        aria-invalid={!!errors.ownerLastName}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.ownerLastName &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("ownerLastName")}
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
                        aria-invalid={!!errors.email}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.email &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("email")}
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
                          setValue("phone", val, {
                            shouldValidate: true,
                            shouldTouch: true,
                          })
                        }}
                        placeholder={t("phonePlaceholder")}
                        aria-invalid={!!errors.phone}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.phone &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("phone")}
                    </div>
                  </div>

                  {/* Commercial Registration */}
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

              {/* ---- STEP 3: Operations & Location ---- */}
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
                        aria-invalid={!!errors.city}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.city &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("city")}
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
                        aria-invalid={!!errors.district}
                        className={cn(
                          "h-12 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50",
                          errors.district &&
                            "border-red-500 focus-visible:ring-red-500 dark:border-red-500"
                        )}
                      />
                      {fieldError("district")}
                    </div>
                  </div>

                  {/* Social / Website Link */}
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
                    {fieldError("socialLink")}
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

              {/* Bottom navigation */}
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-6 dark:border-neutral-800">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="h-auto rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                    <span>{t("back")}</span>
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
                    <span>{t("continue")}</span>
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className="h-auto rounded-xl bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{t("submitting")}</span>
                      </>
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
