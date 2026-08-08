import { Skeleton } from "@/components/ui/skeleton"

export default function OffersLoading() {
  return (
    <div className="container mx-auto space-y-6 px-4 pt-6 pb-12 animate-pulse">
      {/* Top Header Bar & Theme Tab Switcher Skeleton */}
      <div className="flex flex-col gap-4 border-b border-[#ECE6DB] pb-5 md:flex-row md:items-center md:justify-between dark:border-neutral-800">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        {/* Tab Toggle Control Skeleton */}
        <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-[#ECE6DB] bg-[#FAF7F2] p-1.5 dark:border-neutral-800 dark:bg-neutral-900/80">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* 2-Column Sidebar & Main Grid Layout Skeleton */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Desktop Left Sidebar Skeleton */}
        <div className="hidden space-y-4 lg:col-span-1 lg:block">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="space-y-4 rounded-3xl border border-[#ECE6DB] bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <Skeleton className="h-5 w-24 rounded-md" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded-md" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area Skeleton */}
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-12 w-full rounded-2xl" />

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-[24px] border border-[#ECE6DB] bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <Skeleton className="aspect-[16/9] w-full rounded-[18px]" />
                <div className="space-y-2 px-1 pb-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-full" />
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


