import { Skeleton } from "@/components/ui/skeleton"

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-6">
      {/* Title */}
      <Skeleton className="h-9 w-40 rounded-lg" />

      {/* Stepper Skeleton */}
      <div className="flex items-center gap-0 mt-4 mb-8">
        {[1, 2, 3].map((step, index) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            {index < 2 && (
              <div className="flex-1 mx-3 mb-5">
                <Skeleton className="h-px w-full" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grid Content */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 items-start">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-2 space-y-6 rounded-2xl border border-border/40 bg-card p-6 md:p-8">
          <Skeleton className="h-6 w-48 rounded-lg" />

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1 space-y-5 rounded-2xl border border-border/40 bg-card p-6">
          <Skeleton className="h-6 w-36 rounded-lg" />

          {/* Item Skeletons */}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>

          <Skeleton className="h-px w-full" />

          {/* Pricing Totals */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          </div>

          <Skeleton className="h-px w-full" />

          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
