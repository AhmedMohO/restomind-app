import { getTranslations } from "next-intl/server"
import { Brain, Leaf, Users, Heart, Globe, Zap } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

export default async function AboutPage() {
  const t = await getTranslations("About")

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ]

  const missionPoints = [
    { icon: Brain, title: t("point1Title"), desc: t("point1Desc") },
    { icon: Leaf, title: t("point2Title"), desc: t("point2Desc") },
    { icon: Users, title: t("point3Title"), desc: t("point3Desc") },
  ]

  const values = [
    { icon: Leaf, title: t("value1Title"), desc: t("value1Desc") },
    { icon: Heart, title: t("value2Title"), desc: t("value2Desc") },
    { icon: Brain, title: t("value3Title"), desc: t("value3Desc") },
  ]

  return (
    <main className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -top-20 -end-20 size-96 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-0 start-10 size-72 rounded-full bg-primary-foreground/15 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center sm:px-6 md:px-8">
          <span className="inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-bold tracking-wider text-primary-foreground/80 uppercase mb-6">
            {t("badge")}
          </span>
          <h1 className="font-heading mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/75 sm:text-lg">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/50 bg-secondary/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 lg:gap-20">
            <div>
              <span className="inline-block text-xs font-bold tracking-wider text-primary uppercase mb-4">
                {t("missionBadge")}
              </span>
              <h2 className="font-heading text-3xl font-extrabold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                {t("missionTitle")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("missionDesc")}
              </p>
              <div className="mt-8 space-y-6">
                {missionPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <point.icon className="size-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        <span className="font-semibold text-foreground">
                          {point.title}
                        </span>{" "}
                        — {point.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative stat tiles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border/30 bg-primary/10 p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Leaf className="size-5 text-primary" />
                </div>
                <p className="font-heading text-2xl font-bold text-primary">12K+</p>
                <p className="mt-1 text-sm text-muted-foreground">Meals rescued</p>
              </div>
              <div className="mt-6 rounded-3xl border border-border/30 bg-secondary p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Globe className="size-5 text-primary" />
                </div>
                <p className="font-heading text-2xl font-bold text-primary">500+</p>
                <p className="mt-1 text-sm text-muted-foreground">Partner businesses</p>
              </div>
              <div className="rounded-3xl border border-border/30 bg-secondary p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Heart className="size-5 text-primary" />
                </div>
                <p className="font-heading text-2xl font-bold text-primary">98%</p>
                <p className="mt-1 text-sm text-muted-foreground">Customer satisfaction</p>
              </div>
              <div className="mt-6 rounded-3xl border border-border/30 bg-primary/10 p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Zap className="size-5 text-primary" />
                </div>
                <p className="font-heading text-2xl font-bold text-primary">3T</p>
                <p className="mt-1 text-sm text-muted-foreground">Tons of waste prevented</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
              {t("valuesTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              {t("valuesSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {values.map((v, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-3xl border border-border/30 bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <v.icon className="size-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center sm:px-6 md:px-8">
          <h2 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("ctaDesc")}
          </p>
          <Link href="/register" passHref>
            <Button className="mt-8 h-auto rounded-full px-8 py-4 text-base font-semibold">
              {t("ctaButton")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
