"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"

import { categorySchema, type CategoryInput } from "@/schemas/category"
import { useZodResolver } from "@/lib/zod-locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { useCreateCategory, useUpdateCategory } from "../hooks/use-categories"
import type { ApiCategory } from "../api/type"
import { getErrorMessage } from "@/lib/api/utils"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ApiCategory | null
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const t = useTranslations("Dashboard.categories")
  const isEdit = Boolean(category)

  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()

  const {
    register,
    handleSubmit: reactHandleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: useZodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const resetImage = React.useCallback((newPreviewUrl: string | null = null) => {
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return newPreviewUrl
    })
    setImageFile(null)
  }, [])

  const [prevOpen, setPrevOpen] = React.useState(open)
  const [prevCategory, setPrevCategory] = React.useState(category)

  // Reset form when dialog opens/closes or category changes
  if (open !== prevOpen || category !== prevCategory) {
    setPrevOpen(open)
    setPrevCategory(category)
    if (open) {
      if (category) {
        reset({
          name: category.name || "",
          description: category.description || "",
        })
        resetImage(category.image?.secure_url || null)
      } else {
        reset({ name: "", description: "" })
        resetImage(null)
      }
    } else {
      resetImage(null)
      reset({ name: "", description: "" })
    }
  }

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(file)
    })
    setImageFile(file)
  }, [])

  const onDropRejected = React.useCallback(() => {
    toast.error(t("invalidImageError"))
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isSubmitting,
  })

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    resetImage(category?.image?.secure_url || null)
  }

  const onSubmit = reactHandleSubmit(async (values) => {
    if (!isEdit && !imageFile) {
      toast.error(t("imageRequiredError"))
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("name", values.name.trim())
    if (values.description) {
      formData.append("description", values.description.trim())
    }
    if (imageFile) {
      formData.append("image", imageFile)
    }

    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category._id, formData })
        toast.success(t("updateSuccess"))
      } else {
        await createMutation.mutateAsync(formData)
        toast.success(t("createSuccess"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[CategoryDialog] Submit error", err)
      toast.error(
        getErrorMessage(err, isEdit ? t("updateError") : t("createError"))
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editDialogTitle") : t("createDialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDialogDesc") : t("createDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 py-2 max-h-[70vh] overflow-y-auto px-1">
          {/* Dropzone Image Field */}
          <div className="space-y-2">
            <FieldLabel>{t("imageLabel")}</FieldLabel>
            <div
              {...getRootProps()}
              className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative size-24 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                    <Image
                      fill
                      src={previewUrl}
                      alt="Category Preview"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 end-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110"
                      title={t("removeImage")}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    {t("changeImageHint")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Upload className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      {isDragActive ? t("dropzoneActive") : t("uploadImage")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("dropzoneIdle")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="category-name">{t("nameLabel")} *</FieldLabel>
            <Input
              id="category-name"
              {...register("name")}
              placeholder={t("namePlaceholder")}
              className="rounded-xl"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          {/* Description Field */}
          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="category-desc">{t("descLabel")}</FieldLabel>
            <Textarea
              id="category-desc"
              {...register("description")}
              placeholder={t("descPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={!!errors.description}
              className="min-h-[80px] max-h-[140px] rounded-xl overflow-y-auto resize-y"
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              disabled={isSubmitting}
            >
              {t("cancelBtn")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{isEdit ? t("saveChanges") : t("createBtn")}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
