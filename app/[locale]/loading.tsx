import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 px-4 py-16">
      <div className="flex items-center justify-center rounded-full bg-primary/10 p-4 text-primary dark:bg-primary/20">
        <Loader2 className="size-8 animate-spin" />
      </div>
    </div>
  )
}
