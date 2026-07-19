"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { User, MapPin } from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { ProfileHeader } from "./profile-header"
import { ProfileForm } from "./profile-form"
import { AddressList } from "./address-list"
import { AddressDialog } from "./address-dialog"

import {
  updateProfileAction,
  addAddressAction,
  updateAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "../actions/profile-actions"

import type { FullUser, UserAddress, AddressPayload } from "../api/profile"
import type { UpdateProfileInput } from "@/schemas/profile"

interface ProfileContainerProps {
  initialUser: FullUser
  initialAddresses: UserAddress[]
}

export function ProfileContainer({
  initialUser,
  initialAddresses,
}: ProfileContainerProps) {
  const t = useTranslations("Profile")
  const setUser = useAuthStore((s) => s.setUser)

  const [user, setUserData] = useState<FullUser>(initialUser)
  const [addresses, setAddresses] = useState<UserAddress[]>(initialAddresses)
  const [activeTab, setActiveTab] = useState<string>("info")

  // Address Modal state
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null)

  // Transitions
  const [isPending, startTransition] = useTransition()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const activeAddress = addresses.find((a) => a.isDefault) || addresses[0]

  // Handle Profile Update (Form)
  const handleUpdateProfile = async (data: UpdateProfileInput) => {
    const formData = new FormData()

    // Only append fields that actually changed
    if (data.firstName !== user.firstName) formData.append("firstName", data.firstName)
    if (data.lastName !== user.lastName) formData.append("lastName", data.lastName)
    if (data.phone !== (user.phone ?? "")) {
      if (data.phone) formData.append("phone", data.phone)
    }
    if (data.gender !== (user.gender ?? undefined)) {
      if (data.gender) formData.append("gender", data.gender)
    }

    const initialDOB = user.DOB ? new Date(user.DOB).toISOString().split("T")[0] : ""
    if (data.DOB !== initialDOB) {
      if (data.DOB) formData.append("DOB", data.DOB)
    }

    if ([...formData.keys()].length === 0) return

    startTransition(async () => {
      const res = await updateProfileAction(formData)
      if (res.success && res.data) {
        setUserData(res.data)
        setUser({
          _id: res.data._id,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          role: res.data.role,
          isEmailVerified: res.data.isEmailVerified,
        })
        toast.success(t("updateSuccess"))
      } else {
        toast.error(res.message || "Failed to update profile")
      }
    })
  }

  // Handle Avatar File Select & Upload
  const handleAvatarSelect = async (file: File) => {
    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append("image", file)

    const res = await updateProfileAction(formData)
    setIsUploadingAvatar(false)

    if (res.success && res.data) {
      setUserData(res.data)
      setUser({
        _id: res.data._id,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        role: res.data.role,
        isEmailVerified: res.data.isEmailVerified,
      })
      toast.success(t("updateSuccess"))
    } else {
      toast.error(res.message || "Failed to upload avatar")
    }
  }

  // Handle Add/Edit Address Form Submit
  const handleSaveAddress = async (payload: AddressPayload) => {
    startTransition(async () => {
      if (editingAddress) {
        const res = await updateAddressAction(editingAddress._id, payload)
        if (res.success && res.data) {
          setAddresses(res.data)
          toast.success(t("addressUpdateSuccess"))
          setIsAddressDialogOpen(false)
        } else {
          toast.error(res.message || "Failed to update address")
        }
      } else {
        const res = await addAddressAction(payload)
        if (res.success && res.data) {
          setAddresses(res.data)
          toast.success(t("addressAddSuccess"))
          setIsAddressDialogOpen(false)
        } else {
          toast.error(res.message || "Failed to add address")
        }
      }
    })
  }

  // Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    const res = await deleteAddressAction(addressId)
    if (res.success) {
      if (res.data) {
        setAddresses(res.data)
      } else {
        setAddresses((prev) => prev.filter((a) => a._id !== addressId))
      }
      toast.success(t("addressDeleteSuccess"))
    } else {
      toast.error(res.message || "Failed to delete address")
    }
  }

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addressId: string) => {
    const res = await setDefaultAddressAction(addressId)
    if (res.success) {
      if (res.data) {
        setAddresses(res.data)
      } else {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a._id === addressId,
          }))
        )
      }
      toast.success(t("addressDefaultSuccess"))
    } else {
      toast.error(res.message || "Failed to set default address")
    }
  }

  const handleOpenAddModal = () => {
    setEditingAddress(null)
    setIsAddressDialogOpen(true)
  }

  const handleOpenEditModal = (addr: UserAddress) => {
    setEditingAddress(addr)
    setIsAddressDialogOpen(true)
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        user={user}
        activeAddress={activeAddress}
        onAvatarSelect={handleAvatarSelect}
        onAddressClick={() => setActiveTab("addresses")}
        isUploading={isUploadingAvatar}
      />

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border bg-card">
          <TabsTrigger
            value="info"
            className="flex items-center justify-center gap-2 rounded-lg text-xs font-semibold sm:text-sm"
          >
            <User className="size-4" />
            <span>{t("tabPersonalInfo")}</span>
          </TabsTrigger>

          <TabsTrigger
            value="addresses"
            className="flex items-center justify-center gap-2 rounded-lg text-xs font-semibold sm:text-sm"
          >
            <MapPin className="size-4" />
            <span>{t("tabAddresses")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal Info */}
        <TabsContent value="info" className="space-y-6">
          <ProfileForm
            user={user}
            onSubmit={handleUpdateProfile}
            isSubmitting={isPending}
          />
        </TabsContent>

        {/* Tab 2: Delivery Addresses */}
        <TabsContent value="addresses" className="space-y-6">
          <AddressList
            addresses={addresses}
            onAdd={handleOpenAddModal}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteAddress}
            onSetDefault={handleSetDefaultAddress}
          />
        </TabsContent>
      </Tabs>

      {/* Address Add / Edit Modal */}
      <AddressDialog
        open={isAddressDialogOpen}
        onOpenChange={setIsAddressDialogOpen}
        initialData={editingAddress}
        defaultUserName={`${user.firstName} ${user.lastName}`.trim()}
        defaultUserPhone={user.phone}
        onSubmit={handleSaveAddress}
        isSubmitting={isPending}
      />
    </div>
  )
}
