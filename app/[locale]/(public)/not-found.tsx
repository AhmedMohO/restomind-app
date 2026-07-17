import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { UtensilsCrossed } from "lucide-react"

export default async function NotFound() {
  const t = await getTranslations("NotFound")

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed className="size-12 text-primary" />
        </div>
        <span className="absolute -top-2 -end-2 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          !
        </span>
      </div>

      {/* 404 badge */}
      <span className="font-heading text-7xl font-extrabold text-primary/20 select-none sm:text-9xl">
        {t("badge")}
      </span>

      <h1 className="font-heading -mt-4 text-3xl font-extrabold text-foreground sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        {t("description")}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" passHref>
          <Button className="h-auto rounded-full px-6 py-3">
            {t("backHome")}
          </Button>
        </Link>
        <Link href="/offers" passHref>
          <Button variant="outline" className="h-auto rounded-full px-6 py-3">
            {t("exploreOffers")}
          </Button>
        </Link>
      </div>
    </div>
  )
}
