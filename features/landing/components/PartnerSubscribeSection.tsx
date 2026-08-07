"use client"

import React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Store, ArrowRight, Check, Search } from "lucide-react"
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

  const benefits = [
    {
      title: t("benefit1Title"),
      desc: t("benefit1Desc"),
    },
    {
      title: t("benefit2Title"),
      desc: t("benefit2Desc"),
    },
    {
      title: t("benefit3Title"),
      desc: t("benefit3Desc"),
    },
    {
      title: t("benefit4Title"),
      desc: t("benefit4Desc"),
    },
    {
      title: t("benefit5Title"),
      desc: t("benefit5Desc"),
    },
    {
      title: t("benefit6Title"),
      desc: t("benefit6Desc"),
    },
  ]

  const onboardingSteps = [
    {
      number: "1",
      title: t("step1"),
      desc: t("step1Desc"),
    },
    {
      number: "2",
      title: t("step2"),
      desc: t("step2Desc"),
    },
    {
      number: "3",
      title: t("step3"),
      desc: t("step3Desc"),
    },
  ]

  return (
    <section className="relative w-full overflow-hidden border-y border-border/40 py-16 text-white">
      {/* Background Banner Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      {/* Clean high contrast solid dark overlay */}
      <div className="absolute inset-0 bg-stone-950/65" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Split 2-Column Grid */}
        <div className="space-y-4 pb-8 text-center">
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-400 uppercase sm:text-sm"
          >
            <Store className="size-4 text-amber-400" />
            <span>{t("badge")}</span>
          </Badge>

          <h2 className="font-serif text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* LEFT SIDE: Bulleted Merchant Benefits (Col 7) */}
          <div className="space-y-8 lg:col-span-7">
            {/* Header Badge & Title */}

            {/* Bulleted Benefits List - Clean Flat Grid */}
            <div className="grid gap-3.5 pt-1">
              {benefits.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-4 rounded-xl border border-stone-800 bg-stone-900 p-4 transition-colors hover:border-stone-700"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-bold text-stone-950 sm:size-8">
                    <Check className="size-4 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white transition-colors group-hover:text-amber-400 sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed font-normal text-stone-300 sm:text-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Join & Onboarding Card (Col 5) */}
          <div className="lg:col-span-5">
            <div className="space-y-6 rounded-2xl border border-amber-500/30 bg-stone-900 p-6 sm:p-8">
              <div className="space-y-2.5 text-start">
                <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
                  {t("cardTitle")}
                </h3>
                <p className="text-xs leading-relaxed font-medium text-stone-300 sm:text-sm">
                  {t("cardSubtitle")}
                </p>
              </div>

              {/* 3 Step Onboarding Flow */}
              <div className="space-y-3 pt-1">
                {onboardingSteps.map((step, idx) => {
                  // Clean title if string already starts with "1. " or "2. "
                  const cleanTitle = step.title.replace(/^\d+\.\s*/, "")
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 rounded-xl border border-stone-800 bg-stone-950 p-4 transition-colors hover:border-amber-500/30"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-stone-950">
                        {step.number}
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white sm:text-base">
                          {cleanTitle}
                        </h4>
                        <p className="text-xs leading-relaxed font-normal text-stone-300 sm:text-sm">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/partner-application"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "group w-full justify-center gap-2.5 rounded-xl bg-amber-500 py-3.5 text-base font-extrabold text-stone-950 transition-colors hover:bg-amber-400"
                  )}
                >
                  <span>{t("ctaButton")}</span>
                  <ArrowRight className="size-5 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>

                <Link
                  href="/partner-application?tab=status"
                  className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-amber-400 underline-offset-4 transition-colors hover:text-amber-300 hover:underline sm:text-sm"
                >
                  <Search className="size-4 text-amber-400" />
                  <span>{t("ctaSecondary")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
