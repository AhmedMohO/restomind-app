import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <main className="min-h-[80vh] py-8 sm:py-10">
      <div className="container mx-auto space-y-6 px-4">
        {/* Profile Header Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 md:mx-auto md:w-fit md:flex-row md:items-center md:gap-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <Skeleton className="size-24 rounded-full sm:size-28 shrink-0" />
              <div className="flex flex-col items-center text-center sm:items-start sm:text-start space-y-2">
                <Skeleton className="h-8 w-44 rounded-lg" />
                <Skeleton className="h-6 w-52 rounded-full" />
              </div>
            </div>

            <div className="hidden h-16 w-px shrink-0 bg-border md:block" />

            <Skeleton className="h-24 w-full rounded-xl md:w-[280px]" />
          </div>
        </div>

        {/* Navigation Tabs Skeleton */}
        <Skeleton className="h-12 w-full rounded-xl" />

        {/* Form Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
