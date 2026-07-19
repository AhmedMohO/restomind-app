"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  MapPin,
  Plus,
  Check,
  Pencil,
  Trash2,
  Building2,
  Home,
  Loader2,
  MoreHorizontal,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { UserAddress } from "../api/profile"

interface AddressListProps {
  addresses: UserAddress[]
  onAdd: () => void
  onEdit: (address: UserAddress) => void
  onDelete: (addressId: string) => Promise<void>
  onSetDefault: (addressId: string) => Promise<void>
}

export function AddressList({
  addresses,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressListProps) {
  const t = useTranslations("Profile")

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  const maxAddresses = 4
  const count = addresses.length
  const isLimitReached = count >= maxAddresses

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return
    setDeletingId(addressToDelete)
    try {
      await onDelete(addressToDelete)
      setAddressToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    try {
      await onSetDefault(id)
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-xl">
              <MapPin className="size-5 text-muted-foreground" />
              <span>{t("addressesTitle")}</span>
            </CardTitle>
            <CardDescription>{t("addressesDesc")}</CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t("addressCounter", { count, max: maxAddresses })}
            </span>
            <Button
              onClick={onAdd}
              disabled={isLimitReached}
              className="gap-2 rounded-xl"
            >
              <Plus className="size-4" />
              <span>{t("addAddress")}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MapPin className="size-6" />
            </div>
            <h4 className="font-heading text-lg font-semibold text-foreground">
              {t("noAddressesYet")}
            </h4>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("noAddressesYetDesc")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => {
              const isDefault = address.isDefault
              const isSetting = settingDefaultId === address._id
              const isDeleting = deletingId === address._id
              const isBusy = isSetting || isDeleting

              const lowerLabel = (address.label || "").toLowerCase()
              const IconComponent =
                lowerLabel.includes("work") || lowerLabel.includes("office")
                  ? Building2
                  : Home

              return (
                <Card
                  key={address._id}
                  className={`relative flex flex-col justify-between border bg-background transition-colors ${
                    isDefault
                      ? "border-primary/40"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <IconComponent className="size-4" />
                        </div>
                        <h4 className="font-heading text-base font-bold text-foreground min-w-0 break-words leading-tight">
                          {address.label || address.street}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDefault && (
                          <Badge className="gap-1 shrink-0">
                            <Check className="size-3" />
                            <span>{t("defaultBadge")}</span>
                          </Badge>
                        )}
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={isBusy}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-0 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                              aria-label={t("addressActions")}
                            >
                              {isBusy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(address)}>
                                <Pencil className="size-4" />
                                <span>{t("editAddress")}</span>
                              </DropdownMenuItem>

                              {!isDefault && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefault(address._id)}
                                >
                                  <Check className="size-4" />
                                  <span>{t("setAsDefault")}</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setAddressToDelete(address._id)}
                              >
                                <Trash2 className="size-4" />
                                <span>{t("delete")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-foreground/80">
                      <p className="font-medium break-words">{address.street}</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {address.city}
                        {address.country ? `, ${address.country}` : ""}
                      </p>
                      <p className="pt-1 text-xs text-muted-foreground">
                        {address.phoneNumber}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!addressToDelete}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="text-destructive-foreground rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
