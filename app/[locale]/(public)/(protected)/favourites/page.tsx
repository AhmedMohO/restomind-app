import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Heart } from "lucide-react"
import { getFavoritesAction } from "@/features/favorites/actions"
import FavouritesList from "./favourites-list"
import FavouritesLoading from "./loading"
import type { Metadata } from "next"
import { getAlternates } from "@/lib/seo/metadata"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "My Favourites",
    description: "Your handpicked delicious treats and daily fresh offers.",
    alternates: getAlternates(locale, "/favourites"),
    robots: { index: false, follow: false },
  }
}

async function FavouritesFetcher() {
  const res = await getFavoritesAction()
  const initialFavorites = res.success ? res.data : []

  return <FavouritesList initialFavorites={initialFavorites} />
}

export default async function FavouritesPage() {
  const t = await getTranslations("Favourites")

  return (
    <div className="container mx-auto min-h-[60vh] space-y-8 px-4">
      <h1 className="flex items-center gap-3 font-serif text-3xl font-bold tracking-tight text-[#2B1B15] sm:text-4xl dark:text-neutral-100">
        <Heart className="size-8 shrink-0 fill-rose-500 text-rose-500" />
        <span>{t("title")}</span>
      </h1>

      <Suspense fallback={<FavouritesLoading />}>
        <FavouritesFetcher />
      </Suspense>
    </div>
  )
}
