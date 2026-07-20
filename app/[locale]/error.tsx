"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-10 text-destructive" />
      </div>

      <h1 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        An unexpected error occurred. Our team has been notified and we&apos;re working to fix it.
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="h-auto rounded-full px-6 py-3">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" className="h-auto rounded-full px-6 py-3">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
