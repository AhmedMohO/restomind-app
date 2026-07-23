"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, Edit2, FolderTree, Loader2 } from "lucide-react"
import Image from "next/image"
import { Link } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCategoryById } from "../hooks/use-categories"
import { CategoryDialog } from "./category-dialog"

interface CategoryDetailsContainerProps {
  id: string
}

export function CategoryDetailsContainer({ id }: CategoryDetailsContainerProps) {
  const t = useTranslations("Dashboard.categories")
  const { data: category, isLoading, isError, refetch } = useCategoryById(id)

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !category) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("categoryFetchError")}</p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
            Retry
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/categories" />}
            className="rounded-xl"
          >
            {t("backToList")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href="/dashboard/categories" />}
            className="size-9 rounded-xl border border-border"
            title={t("backToList")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">
              {t("categoryDetailsSubtitle")}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="gap-2 rounded-xl"
        >
          <Edit2 className="size-4" />
          <span>{t("editCategory")}</span>
        </Button>
      </div>

      {/* Hero card displaying uploaded Category image avatar and Category Name */}
      <Card className="overflow-hidden rounded-xl border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            {category.image?.secure_url ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:size-28">
                <Image
                  fill
                  src={category.image.secure_url}
                  alt={category.name}
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 96px, 112px"
                />
              </div>
            ) : (
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-28">
                <FolderTree className="size-12" />
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                {category.name}
              </h2>
              {category.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details card displaying Category description */}
      <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t("descLabel")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {category.description ? category.description : "No description provided."}
          </p>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={category}
      />
    </div>
  )
}
