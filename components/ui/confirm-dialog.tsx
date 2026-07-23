"use client"

import * as React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLocale } from "next-intl"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: React.ReactNode
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  icon?: React.ReactNode
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const pending = isLoading || internalLoading
  const locale = useLocale()
  const isAr = locale === "ar"
  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setInternalLoading(false)
    }
  }

  const defaultIcon =
    variant === "destructive" ? (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Trash2 className="size-5" />
      </div>
    ) : (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <AlertTriangle className="size-5" />
      </div>
    )

  return (
    <Dialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        className="rounded-2xl p-5 sm:p-6"
      >
        <div className="flex gap-4">
          {icon ?? defaultIcon}
          <div className="flex flex-1 flex-col gap-1">
            <DialogHeader>
              <DialogTitle className="text-start font-heading text-base font-bold sm:text-lg">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-start text-xs leading-relaxed text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="w-full rounded-xl text-xs sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
            className="w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
