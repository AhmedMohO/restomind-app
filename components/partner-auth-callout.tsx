"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Store, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PartnerAuthCalloutProps {
  variant?: "card" | "banner"
}

export function PartnerAuthCallout({
  variant = "card",
}: PartnerAuthCalloutProps) {
  const t = useTranslations("Auth")

  if (variant === "banner") {
    return (
      <div className="relative rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div className="space-y-1">
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {t("partnerCalloutBadge")}
              </Badge>
              <h4 className="text-sm font-bold text-foreground sm:text-base">
                {t("partnerCalloutTitle")}
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("partnerCalloutSubtitle")}
              </p>
            </div>
          </div>

          <Link href="/partner-application" className="shrink-0">
            <Button
              size="sm"
              className="h-9 w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto"
            >
              <span>{t("partnerCalloutAction")}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-border/80 bg-muted/40 p-4 text-start shadow-2xs">
      {/* Content */}
      <div className="mt-3 flex flex-col items-center justify-center space-y-1">
        <h4 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
          {t("partnerCalloutTitle")}
        </h4>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("partnerCalloutSubtitle")}
        </p>
      </div>

      {/* Full-width Action Button */}
      <div className="mt-4 pt-1">
        <Link href="/partner-application" className="block w-full">
          <Button
            size="lg"
            className="h-10 w-full gap-2 rounded-xl text-xs font-semibold shadow-xs"
          >
            <span>{t("partnerCalloutAction")}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
