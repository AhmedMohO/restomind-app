import { getTranslations } from "next-intl/server"
import { Brain, Leaf, Users, Heart, Sparkles, Utensils, Store, ArrowRight, ShoppingBag, ShieldCheck, TrendingUp, Cpu } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

export default async function AboutPage() {
  const t = await getTranslations("About")

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label"), icon: Store },
    { value: t("stat2Value"), label: t("stat2Label"), icon: Utensils },
    { value: t("stat3Value"), label: t("stat3Label"), icon: Heart },
    { value: t("stat4Value"), label: t("stat4Label"), icon: Leaf },
  ]

  const values = [
    { icon: Leaf, title: t("value1Title"), desc: t("value1Desc") },
    { icon: Users, title: t("value2Title"), desc: t("value2Desc") },
    { icon: Cpu, title: t("value3Title"), desc: t("value3Desc") },
  ]

  return (
    <main className="w-full overflow-hidden">
      {/* Hero Header */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat pt-32 pb-24 text-white md:pt-44 md:pb-36"
        style={{ backgroundImage: "url('/images/Landing/hero.webp')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px]" />

        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6 md:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase backdrop-blur-md text-[#E6BF8F]">
            <Sparkles className="size-3.5" />
            <span>{t("badge")}</span>
          </span>

          <h1 className="font-serif mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/offers">
              <Button className="h-auto rounded-full bg-[#7C4A27] px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]">
                <ShoppingBag className="mr-2 size-5 rtl:mr-0 rtl:ml-2" />
                <span>{t("ctaButton")}</span>
              </Button>
            </Link>

            <Link href="/register">
              <Button variant="outline" className="h-auto rounded-full border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:text-white">
                <Store className="mr-2 size-5 rtl:mr-0 rtl:ml-2" />
                <span>{t("ctaPartner")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-20 -mt-10 container mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-[#ECE6DB] bg-white p-6 shadow-xl md:grid-cols-4 md:p-8 dark:border-neutral-800 dark:bg-neutral-900">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="flex flex-col items-center text-center p-2">
                <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#7C4A27]/10 text-[#7C4A27] dark:bg-[#C2733C]/20 dark:text-[#E68A49]">
                  <Icon className="size-6" />
                </div>
                <p className="font-serif text-3xl font-bold text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Main Mission Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <span className="inline-block text-xs font-bold tracking-wider text-[#7C4A27] uppercase dark:text-[#E68A49]">
              {t("missionBadge")}
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#2B1B15] sm:text-4xl lg:text-5xl dark:text-neutral-100">
              {t("missionTitle")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("missionDesc")}
            </p>
          </div>

          {/* Dual Audience Cards: Customers vs Vendors */}
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Card 1: For Customers */}
            <div className="group relative overflow-hidden rounded-[32px] border border-[#ECE6DB] bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-amber-950/20">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Utensils className="size-7" />
              </div>

              <h3 className="mt-6 font-serif text-2xl font-bold text-[#2B1B15] dark:text-neutral-100">
                {t("forCustomersTitle")}
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#7C4A27] dark:text-[#E68A49]">
                {t("forCustomersSubtitle")}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("forCustomersDesc")}
              </p>

              <div className="mt-8 pt-6 border-t border-dashed border-[#ECE6DB] dark:border-neutral-800">
                <Link href="/offers" className="inline-flex items-center gap-2 text-sm font-bold text-[#7C4A27] transition-colors hover:text-[#60391E] dark:text-[#C2733C]">
                  <span>{t("ctaButton")}</span>
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Card 2: For Vendors */}
            <div className="group relative overflow-hidden rounded-[32px] border border-[#ECE6DB] bg-gradient-to-br from-stone-50/50 via-white to-emerald-50/30 p-8 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-emerald-950/20">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Store className="size-7" />
              </div>

              <h3 className="mt-6 font-serif text-2xl font-bold text-[#2B1B15] dark:text-neutral-100">
                {t("forVendorsTitle")}
              </h3>
              <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("forVendorsSubtitle")}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t("forVendorsDesc")}
              </p>

              <div className="mt-8 pt-6 border-t border-dashed border-[#ECE6DB] dark:border-neutral-800">
                <Link href="/register" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400">
                  <span>{t("ctaPartner")}</span>
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feature Spotlight */}
      <section className="bg-[#FAF7F2] py-20 dark:bg-neutral-900/60">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#7C4A27]/10 px-3.5 py-1 text-xs font-semibold text-[#7C4A27] dark:bg-[#C2733C]/20 dark:text-[#E68A49]">
                <Brain className="size-4" />
                <span>AI Innovation</span>
              </div>

              <h2 className="font-serif text-3xl font-bold text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
                {t("aiTitle")}
              </h2>

              <p className="text-base leading-relaxed text-muted-foreground">
                {t("aiDesc")}
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#529E66]/20 text-[#529E66]">
                    <TrendingUp className="size-3.5" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-[#2B1B15] dark:text-neutral-200">Historical Sales & Trends:</strong> Machine learning algorithms predict unsold stock based on real-time consumption patterns.
                  </p>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#529E66]/20 text-[#529E66]">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-[#2B1B15] dark:text-neutral-200">Food Safety & Quality:</strong> Every listed surplus item strictly adheres to fresh daily standards and allergen disclosure.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual AI Card Showcase */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-[#ECE6DB] bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#7C4A27] flex items-center justify-center text-white">
                      <Brain className="size-5" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-sm text-[#2B1B15] dark:text-neutral-100">RestoMind AI Engine</p>
                      <p className="text-xs text-muted-foreground">Predictive Demand Forecast</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Active • 94.8% Accuracy
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Artisan Sourdough Surplus Risk</span>
                      <span className="text-[#7C4A27] dark:text-[#E68A49]">Low (8 Units)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-[#7C4A27] rounded-full" style={{ width: "35%" }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Croissant & Pastry Surplus Risk</span>
                      <span className="text-amber-600">Moderate (15 Units)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-neutral-800/60 text-xs leading-relaxed text-muted-foreground flex gap-3 items-center mt-6">
                    <Sparkles className="size-5 text-[#7C4A27] shrink-0 dark:text-[#E68A49]" />
                    <span>Auto-converted surplus into 30% discounted daily offer bag for local community rescue.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-14 text-center">
            <h2 className="font-serif text-3xl font-bold text-[#2B1B15] sm:text-4xl lg:text-5xl dark:text-neutral-100">
              {t("valuesTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              {t("valuesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-3xl border border-[#ECE6DB] bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#7C4A27]/10 text-[#7C4A27] dark:bg-[#C2733C]/20 dark:text-[#E68A49]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#2B1B15] dark:text-neutral-100">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {v.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat py-20 text-white"
        style={{ backgroundImage: "url('/images/Landing/hero.webp')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px]" />

        <div className="relative z-10 container mx-auto px-4 text-center sm:px-6 md:px-8">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl lg:text-5xl text-white">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-stone-300 sm:text-lg">
            {t("ctaDesc")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/offers">
              <Button className="h-auto rounded-full bg-[#7C4A27] px-8 py-4 text-base font-semibold text-white hover:bg-[#60391E] dark:bg-[#C2733C] dark:hover:bg-[#AC6432]">
                {t("ctaButton")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
