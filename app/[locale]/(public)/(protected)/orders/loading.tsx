import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

export function OrderSkeletonCard() {
  return (
    <Card className="overflow-hidden rounded-[24px] border-[#ECE6DB] bg-white p-0 shadow-xs md:rounded-[28px] dark:border-neutral-800 dark:bg-neutral-900">
      <CardHeader className="border-b border-[#ECE6DB]/60 p-4 pb-3 md:p-5 dark:border-neutral-800/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-4 py-3 md:p-5">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-[#ECE6DB]/60 p-4 pt-3 md:p-5 dark:border-neutral-800/60">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
      </CardFooter>
    </Card>
  )
}

export function OrderCardsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <OrderSkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function OrdersLoading() {
  return (
    <div className="container mx-auto min-h-[70vh] space-y-6 px-4 py-8">
      {/* Header */}
      <div className="space-y-2 text-start">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-full" />

      {/* Toolbar */}
      <div className="flex justify-between gap-4">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Order Cards */}
      <OrderCardsSkeleton />
    </div>
  )
}
