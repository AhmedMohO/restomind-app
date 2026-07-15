import Image from "next/image"
import { useTranslations } from "next-intl"
import { Brain, Percent, ShoppingBag } from "lucide-react"

export default function StorySection() {
  const t = useTranslations("Story")

  return (
    <section className="relative w-full py-16 md:py-24 bg-background/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 lg:gap-16">
          {/* Image Column */}
          <div className="md:col-span-6 lg:col-span-5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border border-border/30 bg-muted/40 shadow-lg sm:aspect-[3/2] md:aspect-[4/3] lg:aspect-square">
              <Image
                src="/images/Landing/story.png"
                alt="Professional Chef Kneading Dough"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-w-768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>

          {/* Content Column */}
          <div className="flex flex-col justify-center md:col-span-6 lg:col-span-7">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary">
                {t("badge")}
              </span>
              
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl font-heading leading-tight">
                {t("title")}
              </h2>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                {t("description")}
              </p>

              {/* Feature Points list */}
              <div className="mt-8 space-y-6">
                {/* Point 1: AI waste prediction */}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Brain className="size-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">{t("point1Title")}</span> — {t("point1Desc")}
                    </p>
                  </div>
                </div>

                {/* Point 2: Surplus as offers */}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Percent className="size-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">{t("point2Title")}</span> — {t("point2Desc")}
                    </p>
                  </div>
                </div>

                {/* Point 3: Customer rescue/ordering */}
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShoppingBag className="size-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">{t("point3Title")}</span> — {t("point3Desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
