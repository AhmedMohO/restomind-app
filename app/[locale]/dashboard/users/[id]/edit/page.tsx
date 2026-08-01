"use client"

import * as React from "react"
import { use } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  UserForm,
  type UserFormValues,
} from "@/features/users/components/user-form"
import { useUserById, useUpdateUser } from "@/features/users/hooks/use-users"
import { Link } from "@/i18n/routing"
import { getErrorMessage } from "@/lib/api/utils"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

function EditUserPageContent({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("Dashboard.users")
  const router = useRouter()
  const currentUserRole = useAuthStore((s) => s.user?.role)
  const isManager = currentUserRole === "manager"
  const { data: user, isLoading, isError } = useUserById(id)
  const updateMutation = useUpdateUser()

  React.useEffect(() => {
    if (isManager && user && user.role !== "staff") {
      toast.error(t("managerStaffOnlyError"))
      router.replace("/dashboard/users")
    }
  }, [isManager, user, router, t])

  const handleSubmit = async (values: UserFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
          role: isManager ? "staff" : values.role,
          gender: values.gender || undefined,
          DOB: values.DOB || undefined,
        },
      })
      toast.success(t("updateSuccess"))
      router.push("/dashboard/users")
    } catch (err) {
      console.error("[EditUserPage] submit failed", err)
      toast.error(getErrorMessage(err, t("updateError")))
    }
  }

  const defaultValues: Partial<UserFormValues> | undefined = user
    ? {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "customer",
        gender: user.gender ?? undefined,
        DOB: user.DOB ?? undefined,
      }
    : undefined

  return (
    <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
      <div className="flex flex-col gap-6">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard/users" />
            <div className="min-w-0">
              <h1 className="truncate font-heading text-2xl font-bold">
                {isManager ? t("editStaff") : t("editUser")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isManager ? t("editStaffSubtitle") : t("editUserSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : isError || !user ? (
          <Card className="rounded-2xl p-8 text-center">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("userFetchError")}
              </p>
              <Button
                variant="outline"
                render={<Link href="/dashboard/users" />}
                className="mt-4 rounded-xl"
              >
                {t("backToList")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <UserForm
            mode="edit"
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
          />
        )}
      </div>
    </main>
  )
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <EditUserPageContent params={params} />
    </DashboardAuthGuard>
  )
}
