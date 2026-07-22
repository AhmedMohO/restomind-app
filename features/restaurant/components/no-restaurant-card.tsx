"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NoRestaurantCard() {
  const t = useTranslations("Dashboard.restaurant")

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center py-10">
      <Card className="w-full max-w-md border-border bg-card text-center shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <AlertTriangle className="size-7" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold text-card-foreground">
              {t("noRestaurantTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("noRestaurantDesc")}
            </p>
          </div>

          <Button
            variant="outline"
            className="mt-2 gap-2 rounded-xl"
            nativeButton={false}
            render={
              <a
                href="mailto:support@restomind.com"
                aria-label={t("noRestaurantCta")}
              />
            }
          >
            <Mail className="size-4" />
            <span>{t("noRestaurantCta")}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
