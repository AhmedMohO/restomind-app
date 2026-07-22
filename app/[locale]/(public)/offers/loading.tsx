import { Skeleton } from "@/components/ui/skeleton"

export default function OffersLoading() {
  return (
    <div className="container mx-auto animate-pulse space-y-6 px-4 pt-6 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>

      {/* Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Sidebar skeleton (desktop only) */}
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-3 rounded-2xl border border-border/40 bg-muted/10 p-5">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-border/40 bg-muted/10 p-5">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* Main content grid */}
        <div className="space-y-4 lg:col-span-3">
          {/* Search bar */}
          <Skeleton className="h-10 w-full rounded-xl" />

          {/* Offer cards grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-[24px] border border-border/30 bg-card p-3"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-[18px]" />
                <div className="space-y-2 px-1 pb-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
