import { Play } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function HeroSection() {
  const t = await getTranslations("Hero")
  const locale = await getLocale()

  return (
    <main className="relative flex min-h-screen w-full items-center overflow-hidden bg-cover bg-center bg-no-repeat">
      <div
        className={cn("absolute inset-0 bg-cover bg-center bg-no-repeat")}
        style={{
          backgroundImage:
            locale === "ar"
              ? "url('/images/Landing/hero-ar.webp')"
              : "url('/images/Landing/hero.webp')",
        }}
      />
      {/* Main Container */}
      <div className="relative z-10 container mx-auto w-full px-4 pt-28 pb-16 sm:px-6 md:px-8 md:pt-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Content Column (moves to the right on Arabic RTL dynamically) */}
          <div className="flex flex-col justify-center md:col-span-7 lg:col-span-6">
            {/* Glassmorphic card for mobile layout, transparent on desktop */}
            <div className="rounded-3xl border border-white/10 bg-stone-950/30 p-6 backdrop-blur-md sm:p-8 md:border-none md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
              <h1 className="text-start font-sans text-4xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {t("titleLine1")} <br className="hidden sm:inline" />
                {t("titleLine2")}
              </h1>

              <p className="mt-6 max-w-lg text-start font-sans text-sm leading-relaxed font-medium text-white/85 sm:text-base md:text-lg">
                {t("description")}
              </p>

              {/* Buttons Row */}
              <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
                <Link
                  href="/offers"
                  className={cn(
                    buttonVariants(),
                    "h-auto cursor-pointer rounded-full border-0 bg-white px-6 py-3.5 text-sm font-semibold tracking-wider text-stone-900 uppercase shadow-md transition-transform duration-200 hover:scale-105 hover:bg-stone-100 active:scale-95 sm:px-8 sm:py-4"
                  )}
                >
                  {t("ctaOrder")}
                </Link>

                <Link
                  href="#"
                  className="group flex cursor-pointer items-center gap-3 font-sans text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:text-white/80"
                >
                  <span>{t("ctaVideo")}</span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-white/80 bg-white/5 transition-transform group-hover:scale-105 group-active:scale-95">
                    <Play className="ms-0.5 size-3 fill-white text-white" />
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Empty column to showcase the flying cookie and milk glass layout on the other side */}
          <div className="hidden md:col-span-5 md:block lg:col-span-6" />
        </div>
      </div>
    </main>
  )
}
