"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Loader2, Save, Upload, Utensils, X } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PaginatedRestaurantSelect } from "@/features/restaurant/components/paginated-restaurant-select"
import { PaginatedCategorySelect } from "@/features/categories/components/paginated-category-select"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import type { ApiProduct } from "@/features/products/api/type"
import { productFormSchema, type ProductFormInput } from "@/schemas/product"
import { useZodResolver } from "@/lib/zod-locale"

export interface ProductFormProps {
  mode: "create" | "edit"
  product?: ApiProduct | null
  onSubmit: (formData: FormData) => Promise<void> | void
  isPending?: boolean
}

function getRefId(value: ApiProduct["category"] | ApiProduct["restaurantId"]) {
  return typeof value === "string" ? value : (value?._id ?? "")
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

export function ProductForm({
  mode,
  product,
  onSubmit,
  isPending = false,
}: ProductFormProps) {
  const t = useTranslations("Dashboard.products")
  const role = useAuthStore((state) => state.user?.role)
  const isAdmin = role === "admin"
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const displayPreviewUrl = previewUrl ?? product?.image?.secure_url ?? null

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
    },
  })

  React.useEffect(() => {
    if (!product) return
    reset({
      title: product.title ?? "",
      description: product.description ?? "",
      longDescription: product.longDescription ?? "",
      price: product.price ?? 0,
      category: getRefId(product.category),
      freshnessWindow: product.freshnessWindow ?? 24,
      tagsText: getTagsText(product.tags),
      isBestseller: product.isBestseller ?? false,
      isAvailable: product.isAvailable ?? true,
      restaurantId: getRefId(product.restaurantId),
    })
  }, [product, reset])

  const selectedCategory = useWatch({ control, name: "category" })
  const selectedRestaurantId = useWatch({ control, name: "restaurantId" })
  const isBestseller = useWatch({ control, name: "isBestseller" })
  const isAvailable = useWatch({ control, name: "isAvailable" })

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
    onDropRejected: () =>
      toast.error(t("imageTypeError")),
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isPending,
  })

  const handleFormSubmit = handleSubmit(async (values) => {
    if (mode === "create" && !imageFile) {
      toast.error(t("imageRequiredError"))
      return
    }
    if (isAdmin && !values.restaurantId) {
      toast.error(t("restaurantRequiredError"))
      return
    }
    await onSubmit(buildFormData(values, imageFile))
  })

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <Utensils className="size-5 text-primary" />
            <span>{t("formTitle")}</span>
          </CardTitle>
          <CardDescription>
            {t("formSub")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <FieldLabel>{t("imageLabel")} {mode === "create" ? "*" : ""}</FieldLabel>
              <div
                {...getRootProps()}
                className={`group relative flex h-[162px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                } ${isPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input {...getInputProps()} />
                {displayPreviewUrl ? (
                  <div className="relative flex size-full flex-col items-center justify-center gap-1.5">
                    <div className="relative h-24 w-36 overflow-hidden rounded-xl border border-border bg-muted shadow-xs">
                      <Image
                        fill
                        src={displayPreviewUrl}
                        alt="Product preview"
                        className="object-cover"
                        sizes="144px"
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (previewUrl?.startsWith("blob:")) {
                            URL.revokeObjectURL(previewUrl)
                          }
                          setPreviewUrl(null)
                          setImageFile(null)
                        }}
                        className="text-destructive-foreground absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-destructive shadow-md hover:bg-destructive/90"
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
                  disabled={isPending}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.price}>
                  <FieldLabel htmlFor="product-price">{t("priceLabel")} *</FieldLabel>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("price")}
                    disabled={isPending}
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
                    disabled={isPending}
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
                disabled={isPending}
              />
              <FieldError errors={[errors.category]} />
            </Field>

            {isAdmin ? (
              <Field data-invalid={!!errors.restaurantId}>
                <FieldLabel>{t("restaurantLabel")} *</FieldLabel>
                <PaginatedRestaurantSelect
                  value={selectedRestaurantId ?? ""}
                  onValueChange={(value) =>
                    setValue("restaurantId", value ?? "", {
                      shouldValidate: true,
                    })
                  }
                  disabled={isPending}
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
                  disabled={isPending}
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
                disabled={isPending}
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
              className="min-h-20"
              disabled={isPending}
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
              className="min-h-32"
              disabled={isPending}
            />
            <FieldError errors={[errors.longDescription]} />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="product-bestseller" className="text-xs">
              {t("bestsellerLabel")}
            </Label>
            <Switch
              id="product-bestseller"
              checked={isBestseller}
              onCheckedChange={(value) => setValue("isBestseller", value)}
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2 rounded-xl">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>{mode === "edit" ? t("saveChanges") : t("createProduct")}</span>
        </Button>
      </div>
    </form>
  )
}
