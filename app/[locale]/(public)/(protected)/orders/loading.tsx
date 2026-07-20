import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"

function OrderSkeletonCard() {
  return (
    <Card className="rounded-[24px] md:rounded-[28px] border-[#ECE6DB] bg-white dark:bg-neutral-900 dark:border-neutral-800 p-0 overflow-hidden">
      <CardHeader className="p-4 md:p-5 pb-3 border-b border-[#ECE6DB]/60 dark:border-neutral-800/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 py-3">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="p-4 md:p-5 pt-3 border-t border-[#ECE6DB]/60 dark:border-neutral-800/60 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-24 rounded-full shrink-0" />
      </CardFooter>
    </Card>
  )
}

export default function OrdersLoading() {
  return (
    <div className="container mx-auto min-h-[70vh] px-4 py-8 space-y-6">
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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <OrderSkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
