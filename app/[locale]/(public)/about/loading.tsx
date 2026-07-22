import { Skeleton } from "@/components/ui/skeleton"

export default function AboutLoading() {
  return (
    <main className="w-full overflow-hidden animate-pulse">
      {/* Hero Header Skeleton */}
      <section className="relative overflow-hidden bg-stone-200 pt-32 pb-24 md:pt-44 md:pb-36 dark:bg-stone-800">
        <div className="relative z-10 container mx-auto px-4 text-center sm:px-6 md:px-8">
          <Skeleton className="mx-auto h-6 w-36 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-14 w-full max-w-3xl rounded-xl" />
          <Skeleton className="mx-auto mt-6 h-5 w-full max-w-xl rounded-lg" />
          <div className="mt-10 flex justify-center gap-4">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Bar Skeleton */}
      <section className="relative z-20 container mx-auto -mt-10 px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border/40 bg-card p-6 shadow-xl md:grid-cols-4 md:p-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-2 text-center">
              <Skeleton className="mb-3 size-12 rounded-2xl" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="mt-1 h-4 w-24" />
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section Skeleton */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <Skeleton className="mx-auto h-4 w-24" />
            <Skeleton className="mx-auto h-12 w-full max-w-md" />
            <Skeleton className="mx-auto h-16 w-full max-w-xl" />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4 rounded-[32px] border border-border/40 bg-card p-8">
                <Skeleton className="size-14 rounded-2xl" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
