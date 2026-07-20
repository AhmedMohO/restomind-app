import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Heart, Loader2 } from "lucide-react"
import { getFavoritesAction } from "@/features/favorites/actions"
import FavouritesList from "./favourites-list"

function FavouritesLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary dark:text-[#E68A49]" />
    </div>
  )
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
        <Heart className="size-8 shrink-0 fill-rose-500/10 text-rose-500" />
        <span>{t("title")}</span>
      </h1>

      <Suspense fallback={<FavouritesLoading />}>
        <FavouritesFetcher />
      </Suspense>
    </div>
  )
}
