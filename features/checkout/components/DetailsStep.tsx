"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface DetailsFormData {
  fullName: string
  phoneNumber: string
  email: string
  deliveryAddress: string
  specialNotes: string
}

interface DetailsStepProps {
  initialData: DetailsFormData
  onContinue: (data: DetailsFormData) => void
}

const detailsSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().min(8),
  email: z.string().email(),
  deliveryAddress: z.string().min(5),
  specialNotes: z.string().optional(),
})

const inputClass =
  "h-12 rounded-full bg-secondary border-transparent px-5 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-transparent"

const inputErrorClass = "ring-1 ring-destructive focus-visible:ring-destructive"

export default function DetailsStep({ initialData, onContinue }: DetailsStepProps) {
  const t = useTranslations("Checkout")
  const [form, setForm] = useState<DetailsFormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof DetailsFormData, string>>>({})

  function handleChange(field: keyof DetailsFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const result = detailsSchema.safeParse(form)
    if (!result.success) {
      const translatedErrors: Partial<Record<keyof DetailsFormData, string>> = {}
      const errorMap: Record<string, string> = {
        fullName: t("errorFullName"),
        phoneNumber: t("errorPhone"),
        email: t("errorEmail"),
        deliveryAddress: t("errorAddress"),
      }
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof DetailsFormData
        if (!translatedErrors[key]) {
          translatedErrors[key] = errorMap[key]
        }
      })
      setErrors(translatedErrors)
      return
    }
    onContinue(form)
  }

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-6 lg:p-8 space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("yourDetails")}</h2>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("fullName")}</label>
          <Input
            className={cn(inputClass, errors.fullName && inputErrorClass)}
            placeholder={t("fullName")}
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive px-5">{errors.fullName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("phoneNumber")}</label>
          <Input
            className={cn(inputClass, errors.phoneNumber && inputErrorClass)}
            placeholder={t("phoneNumber")}
            type="tel"
            dir="ltr"
            value={form.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive px-5">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("email")}</label>
          <Input
            className={cn(inputClass, errors.email && inputErrorClass)}
            placeholder={t("email")}
            type="email"
            dir="ltr"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          {errors.email && (
            <p className="text-xs text-destructive px-5">{errors.email}</p>
          )}
        </div>

        {/* Delivery Address */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("deliveryAddress")}</label>
          <Input
            className={cn(inputClass, errors.deliveryAddress && inputErrorClass)}
            placeholder={t("deliveryAddress")}
            value={form.deliveryAddress}
            onChange={(e) => handleChange("deliveryAddress", e.target.value)}
          />
          {errors.deliveryAddress && (
            <p className="text-xs text-destructive px-5">{errors.deliveryAddress}</p>
          )}
        </div>

        {/* Special Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("specialNotes")}</label>
          <Textarea
            className="bg-secondary border-transparent placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-transparent"
            placeholder={t("specialNotesPlaceholder")}
            value={form.specialNotes}
            onChange={(e) => handleChange("specialNotes", e.target.value)}
          />
        </div>
      </div>

      {/* Continue button */}
      <Button
        onClick={handleSubmit}
        className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold gap-2"
      >
        {t("continue")}
        <ChevronRight className="size-4 rtl:-scale-x-100" />
      </Button>
    </div>
  )
}
