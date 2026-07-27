"use client"

import * as React from "react"
import { Loader2, PackagePlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@/i18n/routing"
import { getErrorMessage } from "@/lib/api/utils"
import { ProductForm } from "@/features/products/components/product-form"
import {
  useCreateProduct,
  useProductById,
  useUpdateProduct,
} from "@/features/products/hooks/use-products"

interface ProductFormPageProps {
  mode: "create" | "edit"
  id?: string
}

export function ProductFormPage({ mode, id }: ProductFormPageProps) {
  const router = useRouter()
  const t = useTranslations("Dashboard.products")
  const isEdit = mode === "edit"
  const [formKey, setFormKey] = React.useState(0)
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useProductById(isEdit ? (id ?? null) : null)

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (formData: FormData) => {
    try {
      if (isEdit) {
        if (!id) return
        const updatedProduct = await updateMutation.mutateAsync({
          id,
          formData,
        })
        toast.success(t("updateSuccess"))
        router.push(`/dashboard/products/${updatedProduct?._id ?? id}`)
        return
      }

      const createdProduct = await createMutation.mutateAsync(formData)
      toast.success(t("createSuccess"))
      setFormKey((k) => k + 1)
      router.push(`/dashboard/products/${createdProduct?._id ?? ""}`)
    } catch (err) {
      console.error("[ProductFormPage] submit failed", err)
      toast.error(
        getErrorMessage(
          err,
          isEdit ? t("updateError") : t("createError")
        )
      )
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isEdit && (isError || !product)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t("detailFetchError")}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl"
          >
            {t("retry")}
          </Button>
          <Button
            render={<Link href="/dashboard/products" />}
            className="rounded-xl"
          >
            {t("backToList")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BackButton
            href={
              isEdit && id ? `/dashboard/products/${id}` : "/dashboard/products"
            }
          />
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-bold">
              {isEdit ? t("editProduct") : t("createProduct")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? t("formPageSubtitleEdit")
                : t("formPageSubtitleCreate")}
            </p>
          </div>
        </div>
      </div>

      <Card className="rounded-xl border-border bg-card">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackagePlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{t("formSectionTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("requiredNotice")}
              </p>
            </div>
          </div>

          <ProductForm
            key={formKey}
            mode={mode}
            product={product}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}

