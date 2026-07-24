"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import { PaginatedCategorySelect } from "@/features/categories/components/paginated-category-select"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/features/products/hooks/use-products"
import type { ApiProduct } from "@/features/products/api/type"
import { productFormSchema, type ProductFormInput } from "@/schemas/product"
import { useZodResolver } from "@/lib/zod-locale"
import { getErrorMessage } from "@/lib/api/utils"

interface ProductFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ApiProduct | null
}

function getRefId(value: ApiProduct["category"] | ApiProduct["restaurantId"]) {
  return typeof value === "string" ? value : value?._id ?? ""
}

function getTagsText(tags?: string[]) {
  return tags?.filter(Boolean).join(", ") ?? ""
}

function buildFormData(values: ProductFormInput, imageFile: File | null) {
  const formData = new FormData()
  formData.append("title", values.title.trim())
  formData.append("description", values.description.trim())
  formData.append("longDescription", values.longDescription.trim())
  formData.append("price", String(values.price))
  formData.append("category", values.category)
  formData.append("freshnessWindow", String(values.freshnessWindow))
  formData.append(
    "tags",
    values.tagsText
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(",") ?? ""
  )
  formData.append("isBestseller", String(values.isBestseller))
  formData.append("isAvailable", String(values.isAvailable))
  if (values.restaurantId) formData.append("restaurantId", values.restaurantId)
  if (imageFile) formData.append("image", imageFile)
  return formData
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
}: ProductFormSheetProps) {
  const locale = useLocale()
  const t = useTranslations("Dashboard.products")
  const isEdit = Boolean(product)
  const role = useAuthStore((state) => state.user?.role)
  const isAdmin = role === "admin"
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: useZodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      price: 0,
      category: "",
      freshnessWindow: 24,
      tagsText: "",
      isBestseller: false,
      isAvailable: true,
      restaurantId: "",
    },
  })
  const selectedCategory = useWatch({ control, name: "category" })
  const selectedRestaurantId = useWatch({ control, name: "restaurantId" })
  const isBestseller = useWatch({ control, name: "isBestseller" })
  const isAvailable = useWatch({ control, name: "isAvailable" })

  const resetPreview = React.useCallback((next: string | null) => {
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      return next
    })
    setImageFile(null)
  }, [])

  const [prevOpen, setPrevOpen] = React.useState(open)
  const [prevProduct, setPrevProduct] = React.useState(product)

  if (open !== prevOpen || product !== prevProduct) {
    setPrevOpen(open)
    setPrevProduct(product)
    if (open) {
      reset({
        title: product?.title ?? "",
        description: product?.description ?? "",
        longDescription: product?.longDescription ?? "",
        price: product?.price ?? 0,
        category: getRefId(product?.category ?? ""),
        freshnessWindow: product?.freshnessWindow ?? 24,
        tagsText: getTagsText(product?.tags),
        isBestseller: product?.isBestseller ?? false,
        isAvailable: product?.isAvailable ?? true,
        restaurantId: getRefId(product?.restaurantId ?? ""),
      })
      resetPreview(product?.image?.secure_url ?? null)
    } else {
      resetPreview(null)
    }
  }

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setImageFile(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => toast.error(t("imageTypeError")),
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isSubmitting,
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!isEdit && !imageFile) {
      toast.error(t("imageRequiredError"))
      return
    }
    if (isAdmin && !values.restaurantId) {
      toast.error(t("restaurantRequiredError"))
      return
    }

    setIsSubmitting(true)
    try {
      const formData = buildFormData(values, imageFile)
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product._id, formData })
        toast.success(t("updateSuccess"))
      } else {
        await createMutation.mutateAsync(formData)
        toast.success(t("createSuccess"))
      }
      onOpenChange(false)
    } catch (err) {
      console.error("[ProductFormSheet] submit failed", err)
      toast.error(
        getErrorMessage(
          err,
          isEdit ? t("updateError") : t("createError")
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <SheetContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="w-full overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border bg-card/60 p-5 text-start">
          <SheetTitle className="text-base font-bold">
            {isEdit ? t("editProduct") : t("addProduct")}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? t("formPageSubtitleEdit")
              : t("formPageSubtitleCreate")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
              <div className="space-y-2">
                <FieldLabel>{t("imageLabel")} {isEdit ? "" : "*"}</FieldLabel>
                <div
                  {...getRootProps()}
                  className={`group relative flex h-[162px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  {previewUrl ? (
                    <div className="relative flex size-full flex-col items-center justify-center gap-1.5">
                      <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-border bg-muted shadow-xs">
                        <Image
                          fill
                          src={previewUrl}
                          alt="Product preview"
                          className="object-cover"
                          sizes="128px"
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            resetPreview(product?.image?.secure_url ?? null)
                          }}
                          className="absolute top-1.5 end-1.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
                          title={t("removeImage")}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {t("changeImageHint")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Upload className="size-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        {t("uploadImageText")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("uploadImageHint")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Field data-invalid={!!errors.title}>
                  <FieldLabel htmlFor="product-title">{t("titleLabel")} *</FieldLabel>
                  <Input
                    id="product-title"
                    {...register("title")}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                  <FieldError errors={[errors.title]} />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field data-invalid={!!errors.price}>
                    <FieldLabel htmlFor="product-price">{t("priceLabel")} *</FieldLabel>
                    <Input
                      id="product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      {...register("price")}
                      className="rounded-xl"
                      disabled={isSubmitting}
                    />
                    <FieldError errors={[errors.price]} />
                  </Field>

                  <Field data-invalid={!!errors.freshnessWindow}>
                    <FieldLabel htmlFor="product-freshness">
                      {t("freshnessLabel")} *
                    </FieldLabel>
                    <Input
                      id="product-freshness"
                      type="number"
                      min="0"
                      step="1"
                      {...register("freshnessWindow")}
                      className="rounded-xl"
                      disabled={isSubmitting}
                    />
                    <FieldError errors={[errors.freshnessWindow]} />
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.category}>
                <FieldLabel>{t("categoryLabel")} *</FieldLabel>
                <PaginatedCategorySelect
                  value={selectedCategory}
                  onValueChange={(value) =>
                    setValue("category", value ?? "", { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                />
                <FieldError errors={[errors.category]} />
              </Field>

              {isAdmin ? (
                <Field data-invalid={!!errors.restaurantId}>
                  <FieldLabel>{t("restaurantLabel")} *</FieldLabel>
                  <PaginatedRestaurantSelect
                    value={selectedRestaurantId ?? ""}
                    onValueChange={(value) =>
                      setValue("restaurantId", value ?? "", { shouldValidate: true })
                    }
                    disabled={isSubmitting}
                  />
                  <FieldError errors={[errors.restaurantId]} />
                </Field>
              ) : (
                <Field data-invalid={!!errors.tagsText}>
                  <FieldLabel htmlFor="product-tags">{t("tagsLabel")}</FieldLabel>
                  <Input
                    id="product-tags"
                    {...register("tagsText")}
                    placeholder={t("tagPlaceholder")}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                  <FieldError errors={[errors.tagsText]} />
                </Field>
              )}
            </div>

            {isAdmin && (
              <Field data-invalid={!!errors.tagsText}>
                <FieldLabel htmlFor="product-tags">{t("tagsLabel")}</FieldLabel>
                <Input
                  id="product-tags"
                  {...register("tagsText")}
                  placeholder={t("tagPlaceholder")}
                  className="rounded-xl"
                  disabled={isSubmitting}
                />
                <FieldError errors={[errors.tagsText]} />
              </Field>
            )}

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="product-description">
                {t("shortDescLabel")} *
              </FieldLabel>
              <Textarea
                id="product-description"
                {...register("description")}
                className="min-h-20 rounded-xl"
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <Field data-invalid={!!errors.longDescription}>
              <FieldLabel htmlFor="product-long-description">
                {t("longDescLabel")} *
              </FieldLabel>
              <Textarea
                id="product-long-description"
                {...register("longDescription")}
                className="min-h-28 rounded-xl"
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.longDescription]} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="product-bestseller" className="text-xs">
                  {t("bestsellerLabel")}
                </Label>
                <Switch
                  id="product-bestseller"
                  checked={isBestseller}
                  onCheckedChange={(value) => setValue("isBestseller", value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <Label htmlFor="product-available" className="text-xs">
                  {t("availableLabel")}
                </Label>
                <Switch
                  id="product-available"
                  checked={isAvailable}
                  onCheckedChange={(value) => setValue("isAvailable", value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border p-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2 rounded-xl">
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>{isEdit ? t("saveChanges") : t("createProduct")}</span>
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
