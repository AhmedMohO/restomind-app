"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Mail, Hash, Calendar, Building, Sparkles } from "lucide-react"
import { useCheckPartnershipStatus } from "../hooks/use-partnership"
import type { PartnershipApplicationStatusResult } from "../api/type"
import { PartnershipStatusBadge } from "./partnership-status-badge"

export function PartnershipStatusCheck() {
  const t = useTranslations("PartnerApplication")

  const [applicationId, setApplicationId] = useState("")
  const [email, setEmail] = useState("")
  const [statusResult, setStatusResult] =
    useState<PartnershipApplicationStatusResult | null>(null)

  const checkStatusMutation = useCheckPartnershipStatus()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!applicationId.trim() || !email.trim()) {
      toast.error(t("fillAllFields") || "Please enter both Application ID and Email.")
      return
    }

    try {
      const result = await checkStatusMutation.mutateAsync({
        id: applicationId.trim(),
        email: email.trim(),
      })
      if (result) {
        setStatusResult(result)
        toast.success(t("statusFetchSuccess") || "Application status retrieved successfully.")
      }
    } catch (err) {
      console.error("[PartnershipStatusCheck] failed", err)
      setStatusResult(null)
      toast.error(
        err instanceof Error
          ? err.message
          : t("statusFetchError") || "Application not found or email does not match."
      )
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-xl md:p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="p-0 pb-6 border-b border-stone-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7C4A27] dark:text-[#E68A49]">
          <Sparkles className="size-4" />
          <span>{t("checkStatusBadge") || "Check Status"}</span>
        </div>
        <CardTitle className="font-serif text-2xl font-bold text-[#2B1B15] dark:text-stone-100 mt-1">
          {t("checkStatusTitle") || "Track Application Status"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {t("checkStatusDesc") ||
            "Enter your Application Reference ID and business email address to check your application's current progress."}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status-app-id" className="flex items-center gap-2 text-xs font-semibold">
              <Hash className="size-3.5 text-[#7C4A27] dark:text-[#E68A49]" />
              <span>{t("refIdLabel") || "Application Reference ID"} *</span>
            </Label>
            <Input
              id="status-app-id"
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="e.g. RESTO-000123"
              className="h-11 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-email" className="flex items-center gap-2 text-xs font-semibold">
              <Mail className="size-3.5 text-[#7C4A27] dark:text-[#E68A49]" />
              <span>{t("email") || "Business Email Address"} *</span>
            </Label>
            <Input
              id="status-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder") || "e.g. partner@restaurant.com"}
              className="h-11 rounded-xl border-stone-200 bg-stone-50/50 px-3.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50"
            />
          </div>

          <Button
            type="submit"
            disabled={checkStatusMutation.isPending}
            className="w-full h-11 rounded-xl bg-[#7C4A27] text-white hover:bg-[#60391E] font-semibold text-sm transition-transform active:scale-[0.99] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]"
          >
            {checkStatusMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin me-2" />
                <span>{t("checkingStatus") || "Checking Status..."}</span>
              </>
            ) : (
              <>
                <Search className="size-4 me-2" />
                <span>{t("checkStatusBtn") || "Check Status"}</span>
              </>
            )}
          </Button>
        </form>

        {statusResult && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 space-y-4 dark:border-neutral-800 dark:bg-neutral-800/60">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Building className="size-4 text-[#7C4A27] dark:text-[#E68A49]" />
                <span className="font-bold text-base text-foreground">
                  {statusResult.businessName}
                </span>
              </div>
              <PartnershipStatusBadge status={statusResult.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Hash className="size-3.5 shrink-0 text-stone-400" />
                <span>ID: <strong className="font-mono text-foreground">{statusResult.id}</strong></span>
              </div>

              {statusResult.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0 text-stone-400" />
                  <span>Submitted: <strong className="text-foreground">{new Date(statusResult.createdAt).toLocaleDateString()}</strong></span>
                </div>
              )}
            </div>

            {/* Status explanation */}
            <div className="rounded-xl bg-white p-3.5 text-xs text-stone-700 border border-stone-200/60 dark:bg-neutral-900 dark:border-neutral-700/60 dark:text-stone-300">
              {statusResult.status === "PENDING" && (
                <p>
                  ⏳ Your application has been received and is in the queue for initial review by our partner onboarding team.
                </p>
              )}
              {statusResult.status === "UNDER_REVIEW" && (
                <p>
                  🔍 Your application is currently under active review by an account specialist. We will contact you shortly.
                </p>
              )}
              {statusResult.status === "APPROVED" && (
                <p>
                  🎉 <strong>Congratulations!</strong> Your partnership application has been approved. An account setup link has been sent to your business email.
                </p>
              )}
              {statusResult.status === "REJECTED" && (
                <p>
                  ❌ Your application was not approved at this time. Please check your email for detailed review notes.
                </p>
              )}
              {statusResult.status === "ONBOARDED" && (
                <p>
                  ✅ Your restaurant partner account setup is complete. You can now log into your merchant dashboard.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
