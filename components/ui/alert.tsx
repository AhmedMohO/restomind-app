import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-xs grid has-data-[slot=alert-description]:grid-cols-[auto_1fr] grid-cols-[0fr_1fr] has-data-[slot=alert-description]:gap-x-3 gap-y-0.5 items-start data-[variant=default]:bg-card/50 data-[variant=default]:text-card-foreground data-[variant=default]:[&>svg]:text-current data-[variant=destructive]:text-destructive data-[variant=destructive]:[&>svg]:text-current data-[variant=warning]:text-amber-700 dark:data-[variant=warning]:text-amber-300 data-[variant=warning]:[&>svg]:text-current [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-card/50 text-card-foreground",
        destructive:
          "text-destructive bg-card/50 [&>svg]:text-destructive border-destructive/50",
        warning:
          "border-amber-500/50 bg-amber-50/50 text-amber-700 [&>svg]:text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 [&>svg]:dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      data-variant={variant ?? "default"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 text-xs/relaxed text-muted-foreground data-[variant=destructive]:text-destructive/80 data-[variant=warning]:text-amber-700 dark:data-[variant=warning]:text-amber-300",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
