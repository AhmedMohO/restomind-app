export default function Loading() {
  return (
    <div className="w-full animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[60vh] w-full bg-muted" />

      {/* Stats skeleton */}
      <div className="border-b border-border/50 bg-secondary/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-9 w-20 rounded-lg bg-muted" />
                <div className="h-4 w-28 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content section skeleton */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Text column */}
            <div className="space-y-4">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-8 w-3/4 rounded-lg bg-muted" />
              <div className="h-8 w-1/2 rounded-lg bg-muted" />
              <div className="mt-2 space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
              <div className="mt-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="size-10 shrink-0 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-3/4 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cards column */}
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-3xl bg-muted p-6 ${i % 2 === 1 ? "mt-6" : ""}`}
                  style={{ height: "148px" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-12 flex flex-col items-center gap-3">
            <div className="h-8 w-64 rounded-lg bg-muted" />
            <div className="h-4 w-80 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/30 bg-card p-8"
                style={{ minHeight: "200px" }}
              >
                <div className="mb-4 size-12 rounded-full bg-muted" />
                <div className="mb-2 h-6 w-3/4 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-4/6 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
