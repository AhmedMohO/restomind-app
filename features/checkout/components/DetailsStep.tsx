"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  ChevronRight,
  MapPin,
  Plus,
  Check,
  Home,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AddressDialog } from "@/features/profile/components/address-dialog"
import { addAddressAction } from "@/features/profile/actions/profile-actions"
import { getErrorMessage } from "@/lib/api/utils"
import type {
  UserAddress,
  AddressPayload,
} from "@/features/profile/api/profile"

interface DetailsStepProps {
  specialNotes: string
  addresses: UserAddress[]
  selectedAddressId: string | null
  defaultName?: string
  defaultPhone?: string
  onSelectAddress: (addressId: string) => void
  onAddressesChange: (updated: UserAddress[], newAddressId?: string) => void
  onContinue: (specialNotes: string) => void
}

function AddressIcon({ label }: { label?: string }) {
  const lower = (label || "").toLowerCase()
  const Icon =
    lower.includes("work") || lower.includes("office") ? Building2 : Home
  return <Icon className="size-5" />
}

/**
 * Step 1 — delivery address and notes.
 *
 * Contact details are no longer collected here: the API injects the
 * authenticated customer's name, phone and email into the order (docs §9.1).
 */
export default function DetailsStep({
  specialNotes,
  addresses,
  selectedAddressId,
  defaultName = "",
  defaultPhone = "",
  onSelectAddress,
  onAddressesChange,
  onContinue,
}: DetailsStepProps) {
  const t = useTranslations("Checkout")
  const [notes, setNotes] = useState(specialNotes)
  const [addressError, setAddressError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  async function handleAddAddress(payload: AddressPayload) {
    setIsAddingAddress(true)
    try {
      const prevIds = new Set(addresses.map((a) => a._id))
      const res = await addAddressAction(payload)
      if (res.success && res.data) {
        const newId = res.data.find((a) => !prevIds.has(a._id))?._id
        onAddressesChange(res.data, newId)
        setAddressError(null)
        setDialogOpen(false)
        toast.success(res.message || t("addressAdded"))
      } else {
        toast.error(getErrorMessage(res, t("addressAddError")))
      }
    } finally {
      setIsAddingAddress(false)
    }
  }

  function handleSubmit() {
    // If the user has saved addresses, require one to be selected before continuing.
    if (addresses.length > 0 && !selectedAddressId) {
      setAddressError(t("selectAddressError"))
      return
    }

    onContinue(notes)
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border/40 bg-card p-6 lg:p-8">
      <h2 className="text-xl font-bold text-foreground">{t("yourDetails")}</h2>

      <div className="space-y-4">
        {/* Delivery Address — select from saved addresses */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t("deliveryAddress")}
            </label>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
            >
              <Plus className="size-3.5" />
              {t("addNewAddress")}
            </button>
          </div>

          {addresses.length === 0 ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-center transition-colors hover:border-primary/40"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <MapPin className="size-5" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {t("noSavedAddresses")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("addAddressPrompt")}
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => {
                const selected = selectedAddressId === address._id
                return (
                  <button
                    key={address._id}
                    type="button"
                    onClick={() => {
                      onSelectAddress(address._id)
                      setAddressError(null)
                    }}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl p-4 text-start transition-colors duration-200",
                      selected
                        ? "border-2 border-primary bg-secondary/60"
                        : "border border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <AddressIcon label={address.label} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {address.label || address.street}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {address.street}
                        {address.city ? `, ${address.city}` : ""}
                        {address.country ? `, ${address.country}` : ""}
                      </p>
                    </div>

                    {selected && (
                      <Check
                        className="size-4 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {addressError && (
            <p className="px-1 text-xs text-destructive">{addressError}</p>
          )}
        </div>

        {/* Special Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t("specialNotes")}
          </label>
          <Textarea
            className="border-transparent focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-primary/40"
            placeholder={t("specialNotesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Continue button */}
      <Button
        onClick={handleSubmit}
        className="h-12 w-full gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("continue")}
        <ChevronRight className="size-4 rtl:-scale-x-100" />
      </Button>

      {/* Inline add-address dialog (reused from profile) */}
      <AddressDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultUserName={defaultName}
        defaultUserPhone={defaultPhone}
        onSubmit={handleAddAddress}
        isSubmitting={isAddingAddress}
      />
    </div>
  )
}
