"use client"

import React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Store, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function PartnerSubscribeSection() {
  const t = useTranslations("PartnerSubscribe")
  const locale = useLocale()

  const bgImage =
    locale === "ar"
      ? "/images/Landing/hero-ar.webp"
      : "/images/Landing/hero.webp"

  return (
    <section className="relative w-full overflow-hidden border-y border-border/40 py-16 text-white md:py-24">
      {/* Background Banner Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      {/* Overlay for legibility */}
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-[2px]" />

      <div className="relative z-10 container mx-auto px-4 text-center sm:px-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Badge */}
          <Badge
            variant="outline"
            className="rounded-full border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-300 uppercase backdrop-blur-sm"
          >
            <Store className="me-1.5 inline size-3.5" />
            <span>{t("badge")}</span>
          </Badge>

          {/* Heading */}
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-stone-200 sm:text-base md:text-lg">
            {t("subtitle")}
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/partner-application"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-auto rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all hover:scale-105 active:scale-95"
              )}
            >
              <span>{t("ctaButton")}</span>
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
