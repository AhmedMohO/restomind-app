import { Skeleton } from "@/components/ui/skeleton"

export default function RecommendedSkeleton() {
  return (
    <section className="w-full border-b border-border/40 bg-[#FAF7F2] py-16 transition-colors dark:bg-neutral-900/40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-end justify-between px-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur-xs"
            >
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
