import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { Heart } from "lucide-react"
import { getFavoritesAction } from "@/features/favorites/actions"
import FavouritesList from "./favourites-list"
import { Skeleton } from "@/components/ui/skeleton"

function FavouritesLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-3 p-4 pb-0">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-10 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-[#ECE6DB] pt-2 dark:border-neutral-800">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-4 pt-3">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
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
