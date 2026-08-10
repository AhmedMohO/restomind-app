"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Building2, Clock, Mail, Phone, Plus, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/api/utils"
import { useCreateSupplier } from "../hooks/use-suppliers"
import type { CreateSupplierPayload } from "../types"

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierFormDialog({
  open,
  onOpenChange,
}: SupplierFormDialogProps) {
  const t = useTranslations("Dashboard.suppliers")
  const tCommon = useTranslations("Common")
  const createMutation = useCreateSupplier()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [leadTimeDays, setLeadTimeDays] = React.useState<number | "">(1)
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string
    email?: string
    leadTimeDays?: string
  }>({})

  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setName("")
      setEmail("")
      setPhone("")
      setLeadTimeDays(1)
      setFieldErrors({})
    }
  }

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {}

    if (!name.trim()) {
      errors.name = t("errors.nameRequired")
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        errors.email = t("errors.invalidEmail")
      }
    }

    if (leadTimeDays !== "" && Number(leadTimeDays) < 0) {
      errors.leadTimeDays = t("errors.invalidLeadTime")
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateSupplierPayload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      leadTimeDays: leadTimeDays === "" ? 1 : Number(leadTimeDays),
    }

    try {
      await createMutation.mutateAsync(payload)
      toast.success(t("notifications.createSuccess"))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t("notifications.createError")))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[485px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <DialogTitle>{t("createTitle")}</DialogTitle>
                <DialogDescription>{t("createSubtitle")}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="supplier-name" className="flex h-5 items-center gap-1 text-xs font-semibold">
                <span>{t("form.nameLabel")}</span>
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute top-2.5 start-3 size-4 text-muted-foreground" />
                <Input
                  id="supplier-name"
                  placeholder={t("form.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="ps-9"
                  autoFocus
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs font-medium text-destructive">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="supplier-email"
                  className="flex h-5 items-center gap-1 text-xs font-semibold"
                >
                  {t("form.emailLabel")}
                </Label>
                <div className="relative">
                  <Mail className="absolute top-2.5 start-3 size-4 text-muted-foreground" />
                  <Input
                    id="supplier-email"
                    type="email"
                    placeholder={t("form.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ps-9"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="supplier-phone"
                  className="flex h-5 items-center gap-1 text-xs font-semibold"
                >
                  {t("form.phoneLabel")}
                </Label>
                <div className="relative">
                  <Phone className="absolute top-2.5 start-3 size-4 text-muted-foreground" />
                  <Input
                    id="supplier-phone"
                    type="tel"
                    placeholder={t("form.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="ps-9"
                  />
                </div>
              </div>
            </div>

            {/* Lead Time Days */}
            <div className="space-y-1.5">
              <Label
                htmlFor="supplier-lead-time"
                className="flex h-5 items-center gap-1 text-xs font-semibold"
              >
                {t("form.leadTimeLabel")}
              </Label>
              <div className="relative">
                <Clock className="absolute top-2.5 start-3 size-4 text-muted-foreground" />
                <Input
                  id="supplier-lead-time"
                  type="number"
                  min={0}
                  step={1}
                  placeholder={t("form.leadTimePlaceholder")}
                  value={leadTimeDays}
                  onChange={(e) =>
                    setLeadTimeDays(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="ps-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("form.leadTimeHelp")}
              </p>
              {fieldErrors.leadTimeDays && (
                <p className="text-xs font-medium text-destructive">
                  {fieldErrors.leadTimeDays}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                tCommon("saving")
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("createButton")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
