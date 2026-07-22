"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import UserDropdown from "@/components/shadcn-space/blocks/dashboard-shell-01/user-dropdown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationDropdown from "@/components/shadcn-space/blocks/dashboard-shell-01/notification-dropdown"
import { BellRing } from "lucide-react"
import LangToggle from "@/components/common/LangToggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useLocale } from "next-intl"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { useProfile } from "@/features/profile/hooks/use-profile"

function getInitials(first?: string, last?: string): string {
  const f = first?.[0]?.toUpperCase() ?? ""
  const l = last?.[0]?.toUpperCase() ?? ""
  return f + l || "U"
}

export function SiteHeader() {
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const { data: profileUser } = useProfile()
  const initials = getInitials(user?.firstName, user?.lastName)
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ""
  const avatarUrl = profileUser?.image?.secure_url

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 h-8 w-8 cursor-pointer" />
      </div>
      <div className="flex items-center gap-3">
        <LangToggle />
        <ThemeToggle />
        <NotificationDropdown
          defaultOpen={false}
          align="center"
          trigger={
            <div className="relative cursor-pointer rounded-full p-2 before:absolute before:top-1 before:bottom-0 before:left-1/2 before:z-10 before:h-2 before:w-2 before:rounded-full before:bg-red-500 hover:bg-accent">
              <BellRing className="size-4" />
            </div>
          }
        />
        <UserDropdown
          defaultOpen={false}
          align="center"
          locale={locale}
          trigger={
            <div className="rounded-full">
              <Avatar
                className="size-8 cursor-pointer"
                title={displayName || undefined}
              >
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          }
        />
      </div>
    </div>
  )
}
