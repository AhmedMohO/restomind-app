import * as React from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  href: string
  className?: string
  "aria-label"?: string
}

export function BackButton({
  href,
  className,
  "aria-label": ariaLabel = "Back",
}: BackButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      nativeButton={false}
      render={<Link href={href} aria-label={ariaLabel} />}
      className={cn("shrink-0 rounded-xl", className)}
    >
      <ArrowLeft className="size-4" />
    </Button>
  )
}
