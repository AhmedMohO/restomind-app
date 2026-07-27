"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { Calendar, Edit2, Loader2, Mail, Phone, Shield, User } from "lucide-react"

import AppSidebar from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useUserById } from "@/features/users/hooks/use-users"
import { UserRoleBadge } from "@/features/users/components/user-role-badge"
import { UserStatusBadge } from "@/features/users/components/user-status-badge"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

function ViewUserPageContent({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations("Dashboard.users")
  const { data: user, isLoading, isError } = useUserById(id)

  const fullName = user ? `${user.firstName} ${user.lastName}` : t("userDetails")

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
                  {fullName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("userDetailsSubtitle")}
                </p>
              </div>
            </div>

            {user && (
              <Button
                nativeButton={false}
                render={<Link href={`/dashboard/users/${id}/edit`} />}
                className="w-full gap-2 rounded-xl sm:w-auto"
              >
                <Edit2 className="size-4" />
                <span>{t("editUser")}</span>
              </Button>
            )}
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
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {user.image?.secure_url ? (
                  <Image
                    src={user.image.secure_url}
                    alt={fullName}
                    className="size-16 shrink-0 rounded-full border border-border object-cover"
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                    <User className="size-8" />
                  </div>
                )}

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-xl font-bold break-words">
                      {fullName}
                    </h2>
                    <UserRoleBadge role={user.role} />
                    <UserStatusBadge isDeleted={user.isDeleted} />
                  </div>
                  <p className="text-sm break-words text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 pt-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <Mail className="size-5 shrink-0 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t("email")}</span>
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <Phone className="size-5 shrink-0 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t("phone")}</span>
                      <span dir="ltr" className="text-sm font-medium">
                        {user.phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <Shield className="size-5 shrink-0 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t("role")}</span>
                      <span className="text-sm font-medium capitalize">{user.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <Calendar className="size-5 shrink-0 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t("colCreatedAt")}</span>
                      <span className="text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AppSidebar>
  )
}

export default function ViewUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  return (
    <DashboardAuthGuard roles={["admin", "manager"]}>
      <ViewUserPageContent params={params} />
    </DashboardAuthGuard>
  )
}
