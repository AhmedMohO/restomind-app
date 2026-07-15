import Image from "next/image"
import Marquee from "react-fast-marquee"
import { getLocale, getTranslations } from "next-intl/server"

export default async function PartnersSection() {
  const t = await getTranslations("Partners")
  const locale = await getLocale()
  const isRTL = locale === "ar"

  const logos = [
    { src: "/images/Landing/brands/brand_logo_1.png", alt: "Partner Bakery 1" },
    { src: "/images/Landing/brands/brand_logo_2.png", alt: "Partner Bakery 2" },
  ]

  return (
    <section className="relative w-full overflow-hidden border-y border-border/40 bg-muted/20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground/90 sm:text-2xl lg:text-3xl">
            {t("title")}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div dir="ltr">
          <Marquee
            key={locale}
            speed={40}
            pauseOnClick={true}
            autoFill={true}
            direction={isRTL ? "right" : "left"}
          >
            {logos.map((logo, index) => (
              <div
                key={`brand-${index}`}
                className="mx-8 flex h-16 shrink-0 items-center justify-center select-none hover:cursor-grab!"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={64}
                  className="pointer-events-none h-16 w-full rounded-md object-contain"
                  loading={index < 4 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}
