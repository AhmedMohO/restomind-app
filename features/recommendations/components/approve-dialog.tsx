"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api/utils"
import { useEditRecommendation } from "@/features/recommendations/hooks/use-recommendations"
import {
  editRecommendationSchema,
  type EditRecommendationInput,
} from "@/schemas/recommendation"
import type { Recommendation } from "@/features/recommendations/api/type"

export interface ApproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendation: Recommendation | null
}

/**
 * Lets the manager adjust the AI-suggested discount percentage before it is
 * approved. Capped at 1..100 to mirror the backend — uncapped, this
 * previously produced a negative offer price.
 */
export function ApproveDialog({
  open,
  onOpenChange,
  recommendation,
}: ApproveDialogProps) {
  const t = useTranslations("recommendations")
  const editMutation = useEditRecommendation()
  const isPending = editMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditRecommendationInput>({
    resolver: zodResolver(editRecommendationSchema),
    defaultValues: { suggestedValue: recommendation?.suggestedValue ?? 1 },
  })

  React.useEffect(() => {
    if (open && recommendation) {
      reset({ suggestedValue: recommendation.suggestedValue })
    }
  }, [open, recommendation, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!recommendation) return
    try {
      await editMutation.mutateAsync({
        id: recommendation._id,
        suggestedValue: values.suggestedValue,
      })
      toast.success(t("editSuccess"))
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err, t("editError")))
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("editDialogTitle")}</DialogTitle>
          <DialogDescription>{t("editDialogDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field data-invalid={!!errors.suggestedValue}>
            <FieldLabel htmlFor="rec-suggested-value">
              {t("discountPercentLabel")}
            </FieldLabel>
            <Input
              id="rec-suggested-value"
              type="number"
              min={1}
              max={100}
              step={1}
              disabled={isPending}
              {...register("suggestedValue", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.suggestedValue]} />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
