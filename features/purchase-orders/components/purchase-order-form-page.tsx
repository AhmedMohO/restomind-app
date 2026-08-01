"use client"

import { useTranslations } from "next-intl"

import { BackButton } from "@/components/ui/back-button"
import { PurchaseOrderForm } from "./purchase-order-form"

export function PurchaseOrderFormPage() {
  const t = useTranslations("Dashboard.purchaseOrders")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <BackButton
              href="/dashboard/purchase-orders"
              aria-label={t("backToList")}
            />
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {t("addPO")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("formSubtitle")}</p>
        </div>
      </div>

      <PurchaseOrderForm />
    </div>
  )
}
