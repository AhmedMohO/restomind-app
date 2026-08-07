"use client"

import { useTransition } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Settings, LogOut, CreditCard } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { logoutAction } from "@/features/auth/actions/login"
import { useQueryClient } from "@tanstack/react-query"
import { useProfile } from "@/features/profile/hooks/use-profile"

type Props = {
  trigger: ReactNode
  defaultOpen?: boolean
  align?: "start" | "center" | "end"
  /** Current locale, used to build locale-prefixed logout/profile links. */
  locale?: string
}

const itemClass =
  "p-2 text-sm font-medium text-popover-foreground cursor-pointer gap-2"

function getInitials(first?: string, last?: string): string {
  const f = first?.[0]?.toUpperCase() ?? ""
  const l = last?.[0]?.toUpperCase() ?? ""
  return f + l || "U"
}

const UserDropdown = ({
  trigger,
  defaultOpen,
  align = "end",
  locale = "en",
}: Props) => {
  const t = useTranslations("Dashboard.nav")
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { data: profileUser } = useProfile()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ""
  const initials = getInitials(user?.firstName, user?.lastName)
  const avatarUrl = profileUser?.image?.secure_url

  // Mirrors the logout flow used by the customer Navbar: clears the Zustand
  // store, clears the entire query cache, and refreshes the RSC tree.
  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      setUser(null)
      queryClient.clear()
      router.refresh()
      router.push(`/${locale}`)
    })
  }

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu defaultOpen={defaultOpen}>
        <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="w-3xs rounded-2xl duration-400 data-open:fade-in-0 data-open:slide-in-from-bottom-20! data-closed:fade-out-0 data-closed:slide-out-to-bottom-20 data-closed:zoom-out-100"
        >
          {/* User Info */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
              <div className="relative">
                <Avatar className="data-[size=lg]:size-8">
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="absolute right-0 bottom-0 size-2 rounded-full bg-green-600 ring-2 ring-card" />
              </div>

              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-popover-foreground">
                  {displayName || "—"}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Account & Billing */}
          <DropdownMenuGroup>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href={`/${locale}/dashboard/profile`} />}
            >
              <Settings size={20} />
              <span>{t("accountSettings")}</span>
            </DropdownMenuItem>
            {user?.role !== "admin" && (
              <DropdownMenuItem
                className={itemClass}
                render={<Link href={`/${locale}/dashboard/billing`} />}
              >
                <CreditCard size={20} />
                <span>{t("billingSubscription")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            variant="destructive"
            className={itemClass}
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserDropdown
