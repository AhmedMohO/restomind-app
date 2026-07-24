import { setRequestLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import PartnerApplicationForm from "@/features/partner/components/PartnerApplicationForm"
import { getAlternates } from "@/lib/seo/metadata"
import { Sparkles } from "lucide-react"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "PartnerApplication" })

  return {
    title: `${t("title")} — RestoMind`,
    description: t("subtitle"),
    alternates: getAlternates(locale, "/partner-application"),
  }
}

export default async function PartnerApplicationPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("PartnerApplication")

  return (
    <main className="w-full pb-20 dark:bg-neutral-950">
      {/* Header Hero */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat pt-32 pb-16 text-white md:pt-40 md:pb-20"
        style={{ backgroundImage: "url('/images/Landing/hero.webp')" }}
      >
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px]" />

        <div className="relative z-10 container mx-auto px-4 text-center sm:px-6 md:px-8">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-[#E6BF8F] uppercase backdrop-blur-md">
            <Sparkles className="size-3.5 text-[#E6BF8F]" />
            <span>{t("badge")}</span>
          </span>

          <h1 className="mx-auto max-w-3xl font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-300 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Main Form Container */}
      <section className="relative z-20 container mx-auto -mt-10 px-4 sm:px-6 md:px-8">
        <PartnerApplicationForm />
      </section>
    </main>
  )
}
