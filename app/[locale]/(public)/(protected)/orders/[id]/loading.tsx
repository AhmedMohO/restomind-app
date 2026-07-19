import { Skeleton } from "@/components/ui/skeleton"

export default function OrderDetailsLoading() {
  return (
    <div className="container mx-auto min-h-[75vh] max-w-4xl px-4 py-8 space-y-8 animate-pulse">
      {/* Back button skeleton */}
      <Skeleton className="h-9 w-36 rounded-full" />

      {/* Header card skeleton */}
      <div className="rounded-[24px] border border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>

        {/* Timeline stepper skeleton */}
        <div className="grid grid-cols-5 gap-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 rounded-[24px] border border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Right Column: Pricing & Delivery */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="rounded-[24px] border border-[#ECE6DB] dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
