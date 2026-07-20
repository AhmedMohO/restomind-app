import { getTranslations } from "next-intl/server"
import { ShieldCheck } from "lucide-react"

export default async function PrivacyPage() {
  const t = await getTranslations("Privacy")

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
    { title: t("section4Title"), body: t("section4Body") },
    { title: t("section5Title"), body: t("section5Body") },
    { title: t("section6Title"), body: t("section6Body") },
    { title: t("section7Title"), body: t("section7Body") },
    { title: t("section8Title"), body: t("section8Body") },
    { title: t("section9Title"), body: t("section9Body") },
  ]

  return (
    <main className="w-full">
      {/* Header */}
      <section className="relative overflow-hidden bg-primary pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-10 start-10 size-80 rounded-full bg-primary-foreground/20 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 sm:px-6 md:px-8">
          <span className="inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-bold tracking-wider text-primary-foreground/80 uppercase mb-4">
            {t("badge")}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <ShieldCheck className="size-7 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-primary-foreground sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/60">{t("lastUpdated")}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 md:px-8">
          {/* Intro */}
          <div className="rounded-3xl border border-border/30 bg-secondary/40 p-6 sm:p-8">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("intro")}
            </p>
          </div>

          {/* Sections */}
          <div className="mt-8 space-y-0 divide-y divide-border/50">
            {sections.map((section, i) => (
              <div key={i} className="py-8">
                <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
