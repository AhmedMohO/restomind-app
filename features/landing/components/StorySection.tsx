"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import {
  Store,
  ShoppingBag,
  Brain,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function StorySection() {
  const t = useTranslations("Story")
  const [activeTab, setActiveTab] = useState<"all" | "merchant" | "customer">(
    "all"
  )

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-16 sm:py-20 md:py-28">
      {/* Background Accent Glows (RTL & LTR Direction Aware) */}
      <div className="pointer-events-none absolute top-1/4 -start-20 size-96 rounded-full bg-primary/5 blur-3xl transition-all duration-700 ease-in-out" />
      <div className="pointer-events-none absolute bottom-1/4 -end-20 size-96 rounded-full bg-amber-500/5 blur-3xl transition-all duration-700 ease-in-out" />

      <div className="relative container mx-auto px-4 sm:px-6 md:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-wider text-primary uppercase shadow-xs transition-all duration-300 hover:border-primary/40 hover:bg-primary/15">
            <Sparkles className="size-3.5" />
            <span>{t("badge")}</span>
          </span>

          <h2 className="mt-4 font-heading text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>

          {/* Interactive Audience Switcher Tabs */}
          <div className="mt-8 inline-flex items-center rounded-2xl border border-border/60 bg-muted/60 p-1.5 shadow-xs backdrop-blur-md transition-all duration-300">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ease-in-out sm:px-5 sm:py-2.5 sm:text-sm",
                activeTab === "all"
                  ? "bg-background text-foreground shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <Users className="size-4 transition-transform duration-300" />
              <span>{t("tabAll")}</span>
            </button>

            <button
              onClick={() => setActiveTab("merchant")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ease-in-out sm:px-5 sm:py-2.5 sm:text-sm",
                activeTab === "merchant"
                  ? "bg-amber-500 text-slate-950 shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-amber-500/10"
              )}
            >
              <Store className="size-4 transition-transform duration-300" />
              <span>{t("tabMerchant")}</span>
            </button>

            <button
              onClick={() => setActiveTab("customer")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ease-in-out sm:px-5 sm:py-2.5 sm:text-sm",
                activeTab === "customer"
                  ? "bg-primary text-primary-foreground shadow-sm scale-100"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
              )}
            >
              <ShoppingBag className="size-4 transition-transform duration-300" />
              <span>{t("tabCustomer")}</span>
            </button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="mt-12 grid grid-cols-1 items-center gap-10 md:mt-16 md:grid-cols-12 lg:gap-14">
          {/* Visual Images Column */}
          <div className="md:col-span-6 lg:col-span-5">
            <div className="relative transition-all duration-500 ease-in-out">
              {/* Dual image view when 'all' tab is selected */}
              {activeTab === "all" && (
                <div className="relative aspect-[4/3] w-full animate-in fade-in-50 zoom-in-95 transition-all duration-500 ease-in-out sm:aspect-[3/2] md:aspect-[4/3] lg:aspect-square">
                  {/* Top/Primary Image: Merchant (Positioned start-0 top-0) */}
                  <div className="absolute top-0 start-0 h-[78%] w-[82%] overflow-hidden rounded-3xl border border-border/40 bg-muted shadow-xl transition-all duration-500 ease-in-out hover:scale-[1.03] hover:shadow-2xl">
                    <Image
                      src="/images/Landing/story-merchant.png"
                      alt="Artisan Baker and AI Surplus Management"
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300" />
                    <div className="absolute bottom-3 start-3 end-3 text-white transition-all duration-300">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-slate-950 backdrop-blur-xs transition-all duration-300 hover:bg-amber-400">
                        <Store className="size-3" />
                        {t("merchantBadge")}
                      </span>
                    </div>
                  </div>

                  {/* Overlapping Bottom Image: Customer (Positioned end-0 bottom-0) */}
                  <div className="absolute bottom-0 end-0 h-[68%] w-[72%] overflow-hidden rounded-3xl border-2 border-background bg-muted shadow-2xl transition-all duration-500 ease-in-out hover:scale-[1.03]">
                    <Image
                      src="/images/Landing/story-customer.png"
                      alt="Customer Enjoying Fresh Surplus Meal"
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300" />
                    <div className="absolute bottom-3 start-3 end-3 text-white transition-all duration-300">
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-primary-foreground backdrop-blur-xs transition-all duration-300 hover:bg-primary">
                        <ShoppingBag className="size-3" />
                        {t("customerBadge")}
                      </span>
                    </div>
                  </div>

                  {/* Glassmorphism Stat Badge (Direction Aware start-4 top-4) */}
                  <div className="absolute top-4 start-4 z-20 flex items-center gap-2.5 rounded-2xl border border-white/20 bg-background/90 px-4 py-2.5 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-background">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors duration-300">
                      <Leaf className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-foreground">
                        {t("impactTitle")}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {t("impactSub")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Single Focus Image: Merchant */}
              {activeTab === "merchant" && (
                <div className="relative aspect-[4/3] w-full animate-in fade-in-50 zoom-in-95 overflow-hidden rounded-3xl border border-amber-500/30 bg-muted shadow-2xl transition-all duration-500 ease-in-out sm:aspect-[3/2] md:aspect-[4/3] lg:aspect-square">
                  <Image
                    src="/images/Landing/story-merchant.png"
                    alt="Artisan Baker"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300" />

                  {/* Floating Stat Overlay (Direction Aware start-6 end-6 bottom-6) */}
                  <div className="absolute bottom-6 start-6 end-6 rounded-2xl border border-amber-500/30 bg-stone-950/80 p-4 text-white backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:bg-stone-950/90">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 font-bold text-stone-950 transition-transform duration-300 hover:scale-110">
                        <TrendingUp className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-400">
                          {t("merchantStatTitle")}
                        </h4>
                        <p className="text-xs text-stone-300">
                          {t("merchantStatSub")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Single Focus Image: Customer */}
              {activeTab === "customer" && (
                <div className="relative aspect-[4/3] w-full animate-in fade-in-50 zoom-in-95 overflow-hidden rounded-3xl border border-primary/30 bg-muted shadow-2xl transition-all duration-500 ease-in-out sm:aspect-[3/2] md:aspect-[4/3] lg:aspect-square">
                  <Image
                    src="/images/Landing/story-customer.png"
                    alt="Customer enjoying food"
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300" />

                  {/* Floating Stat Overlay (Direction Aware start-6 end-6 bottom-6) */}
                  <div className="absolute bottom-6 start-6 end-6 rounded-2xl border border-primary/30 bg-background/80 p-4 text-foreground shadow-lg backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-background/90">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground transition-transform duration-300 hover:scale-110">
                        <Percent className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-primary">
                          {t("customerStatTitle")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("customerStatSub")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex flex-col justify-center md:col-span-6 lg:col-span-7">
            {/* OVERVIEW TAB CONTENT */}
            {activeTab === "all" && (
              <div className="grid grid-cols-1 gap-6 animate-in fade-in-50 slide-in-from-bottom-3 transition-all duration-500 ease-in-out sm:grid-cols-2">
                {/* Merchant Highlight Card */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-card/60 p-6 transition-all duration-300 ease-in-out hover:border-amber-500/60 hover:bg-card hover:shadow-xl hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/20">
                        <Store className="size-5" />
                      </div>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 transition-colors duration-300 group-hover:bg-amber-500/20">
                        {t("merchantBadge")}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-amber-500">
                      {t("merchantTitle")}
                    </h3>

                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t("merchantDesc")}
                    </p>

                    <ul className="space-y-2.5 pt-2">
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("merchantPoint1Title")}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("merchantPoint2Title")}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("merchantPoint3Title")}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href="/partner-application"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all duration-300 ease-in-out hover:bg-amber-400 hover:shadow-md active:scale-[0.98] sm:text-sm"
                    >
                      <span>{t("ctaMerchant")}</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Customer Highlight Card */}
                <div className="group relative flex flex-col justify-between rounded-2xl border border-primary/30 bg-card/60 p-6 transition-all duration-300 ease-in-out hover:border-primary/60 hover:bg-card hover:shadow-xl hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                        <ShoppingBag className="size-5" />
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors duration-300 group-hover:bg-primary/20">
                        {t("customerBadge")}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {t("customerTitle")}
                    </h3>

                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t("customerDesc")}
                    </p>

                    <ul className="space-y-2.5 pt-2">
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("customerPoint1Title")}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("customerPoint2Title")}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs font-medium text-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                        <span>{t("customerPoint3Title")}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href="#recommended"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-md active:scale-[0.98] sm:text-sm"
                    >
                      <span>{t("ctaCustomer")}</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* MERCHANT TAB DETAILED CONTENT */}
            {activeTab === "merchant" && (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 transition-all duration-500 ease-in-out">
                <div>
                  <span className="inline-block text-xs font-bold tracking-wider text-amber-500 uppercase transition-all duration-300">
                    {t("merchantBadge")}
                  </span>
                  <h3 className="mt-2 font-heading text-2xl leading-tight font-extrabold text-foreground sm:text-3xl lg:text-4xl">
                    {t("merchantTitle")}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t("merchantDesc")}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="group flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-amber-500/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/20">
                      <Brain className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-amber-500 sm:text-base">
                        {t("merchantPoint1Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("merchantPoint1Desc")}
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-amber-500/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/20">
                      <TrendingUp className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-amber-500 sm:text-base">
                        {t("merchantPoint2Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("merchantPoint2Desc")}
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-amber-500/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/20">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-amber-500 sm:text-base">
                        {t("merchantPoint3Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("merchantPoint3Desc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/partner-application"
                    className="group inline-flex items-center gap-2.5 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-md transition-all duration-300 ease-in-out hover:bg-amber-400 hover:shadow-lg active:scale-[0.98] sm:text-base"
                  >
                    <span>{t("ctaMerchant")}</span>
                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </Link>
                </div>
              </div>
            )}

            {/* CUSTOMER TAB DETAILED CONTENT */}
            {activeTab === "customer" && (
              <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 transition-all duration-500 ease-in-out">
                <div>
                  <span className="inline-block text-xs font-bold tracking-wider text-primary uppercase transition-all duration-300">
                    {t("customerBadge")}
                  </span>
                  <h3 className="mt-2 font-heading text-2xl leading-tight font-extrabold text-foreground sm:text-3xl lg:text-4xl">
                    {t("customerTitle")}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t("customerDesc")}
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="group flex items-start gap-4 rounded-2xl border border-primary/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-primary/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                      <Percent className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-primary sm:text-base">
                        {t("customerPoint1Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("customerPoint1Desc")}
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 rounded-2xl border border-primary/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-primary/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-primary sm:text-base">
                        {t("customerPoint2Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("customerPoint2Desc")}
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 rounded-2xl border border-primary/20 bg-card p-4.5 shadow-xs transition-all duration-300 ease-in-out hover:border-primary/40 hover:bg-card/90 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                      <Leaf className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground transition-colors duration-300 group-hover:text-primary sm:text-base">
                        {t("customerPoint3Title")}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {t("customerPoint3Desc")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="#recommended"
                    className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground shadow-md transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] sm:text-base"
                  >
                    <span>{t("ctaCustomer")}</span>
                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
