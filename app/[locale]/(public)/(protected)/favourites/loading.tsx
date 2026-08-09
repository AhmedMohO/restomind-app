import { Skeleton } from "@/components/ui/skeleton"

export function FavoriteProductSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-[#ECE6DB] bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        {/* Product Image Skeleton */}
        <Skeleton className="aspect-[4/3] w-full" />

        {/* Info Area Skeleton */}
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

      {/* Button Skeleton */}
      <div className="p-4 pt-3">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  )
}

export function FavouritesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <FavoriteProductSkeleton key={i} />
      ))}
    </div>
  )
}

export default function FavouritesLoading() {
  return (
    <div className="container mx-auto min-h-[60vh] space-y-8 px-4 py-8">
      {/* Title Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Grid of Product Cards */}
      <FavouritesGridSkeleton />
    </div>
  )
}
