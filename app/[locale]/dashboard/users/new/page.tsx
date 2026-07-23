"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { BackButton } from "@/components/ui/back-button"
import { UserForm, type UserFormValues } from "@/features/users/components/user-form"
import { useCreateUser } from "@/features/users/hooks/use-users"
import { getErrorMessage } from "@/lib/api/utils"
import { useAuthStore } from "@/features/auth/store/useAuthStore"

export default function NewUserPage() {
  const t = useTranslations("Dashboard.users")
  const router = useRouter()
  const createMutation = useCreateUser()
  const currentUserRole = useAuthStore((s) => s.user?.role)
  const isManager = currentUserRole === "manager"

  const handleSubmit = async (values: UserFormValues) => {
    try {
      await createMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email!,
        password: values.password!,
        phone: values.phone,
        role: isManager ? "staff" : values.role,
        gender: values.gender!,
        DOB: values.DOB!,
      })
      toast.success(t("createSuccess"))
      router.push("/dashboard/users")
    } catch (err) {
      console.error("[NewUserPage] submit failed", err)
      toast.error(getErrorMessage(err, t("createError")))
    }
  }

  return (
    <AppSidebar>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <div className="flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BackButton href="/dashboard/users" />
              <div className="min-w-0">
                <h1 className="truncate font-heading text-2xl font-bold">
                  {isManager ? t("addStaff") : t("createUser")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isManager ? t("addStaffSubtitle") : t("createUserSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <UserForm
            mode="create"
            onSubmit={handleSubmit}
            isPending={createMutation.isPending}
          />
        </div>
      </main>
    </AppSidebar>
  )
}
