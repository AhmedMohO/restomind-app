"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Link } from "@/i18n/routing"
import { formatDate } from "@/lib/utils"
import type { ApiSupplier } from "../types"

interface SupplierDetailsDialogProps {
  supplier: ApiSupplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailsDialog({
  supplier,
  open,
  onOpenChange,
}: SupplierDetailsDialogProps) {
  const t = useTranslations("Dashboard.suppliers")
  const tCommon = useTranslations("Common")

  if (!supplier) return null

  const leadTime = supplier.leadTimeDays ?? 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-xl font-bold">
                {supplier.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t("detailsSubtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quick Summary Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1 font-medium">
              <Clock className="size-3.5 text-primary" />
              {t("leadTimeBadge", { count: leadTime })}
            </Badge>

            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-normal text-muted-foreground">
              <Calendar className="size-3.5" />
              {supplier.createdAt
                ? formatDate(supplier.createdAt)
                : t("unknownDate")}
            </Badge>
          </div>

          {/* Contact Details Card */}
          <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("contactSectionTitle")}
            </h4>

            <div className="grid gap-2.5">
              {/* Email */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 text-primary/70" />
                  {t("form.emailLabel")}:
                </span>
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {supplier.email}
                  </a>
                ) : (
                  <span className="italic text-muted-foreground">—</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 text-primary/70" />
                  {t("form.phoneLabel")}:
                </span>
                {supplier.phone ? (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {supplier.phone}
                  </a>
                ) : (
                  <span className="italic text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Prompt Card */}
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {t("createPoPromptTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("createPoPromptSubtitle")}
              </p>
            </div>
            <Link
              href={`/dashboard/purchase-orders/new?supplierId=${supplier._id}`}
              className={buttonVariants({ size: "sm", className: "gap-1.5 shrink-0" })}
            >
              <Truck className="size-4" />
              {t("createPoButton")}
            </Link>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
