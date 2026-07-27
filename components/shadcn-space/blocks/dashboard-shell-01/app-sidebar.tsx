"use client"

import React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { NavMain } from "@/components/shadcn-space/blocks/dashboard-shell-01/nav-main"
import { BarChart3, Carrot, ChefHat, FolderTree, Package, Percent, Receipt, ShoppingBag, Store, Settings, Users, type LucideIcon } from "lucide-react"
import { SiteHeader } from "@/components/shadcn-space/blocks/dashboard-shell-01/site-header"
import SimpleBar from "simplebar-react"
import "simplebar-react/dist/simplebar.min.css"

import { useAuth } from "@/features/auth/hooks/useAuth"
import type { UserRole } from "@/features/auth/auth"

export type NavItem = {
  label?: string
  isSection?: boolean
  title?: string
  icon?: LucideIcon
  href?: string
  roles?: UserRole[]
  children?: NavItem[]
  isActive?: boolean
}

/**
 * Filter nav items and section headers according to the user's role.
 * Empty sections (sections with zero allowed items) are automatically omitted.
 */
function filterNavByRole(
  items: NavItem[],
  userRole: UserRole | null,
  isHydrated: boolean
): NavItem[] {
  const result: NavItem[] = []
  let currentSection: NavItem | null = null

  for (const item of items) {
    if (item.isSection) {
      currentSection = item
    } else {
      const isAllowed =
        !item.roles ||
        !isHydrated ||
        (userRole !== null && item.roles.includes(userRole))

      if (isAllowed) {
        if (currentSection) {
          result.push(currentSection)
          currentSection = null
        }
        const filteredChildren = item.children
          ? filterNavByRole(item.children, userRole, isHydrated)
          : undefined

        result.push({
          ...item,
          children: filteredChildren,
        })
      }
    }
  }

  return result
}

function useDashboardNav(): NavItem[] {
  const t = useTranslations("Dashboard.nav")
  const { role, isHydrated } = useAuth()

  const rawNav: NavItem[] = [
    // Section 1: Overview
    { label: t("overview"), isSection: true },
    {
      title: t("analytics"),
      icon: BarChart3,
      href: "/dashboard",
      roles: ["admin", "manager"],
    },
    {
      title: t("sales"),
      icon: Receipt,
      href: "/dashboard/sales",
      roles: ["admin", "manager"],
    },

    // Section 2: Management
    { label: t("management"), isSection: true },
    {
      title: role === "admin" ? t("restaurants") : t("restaurantProfile"),
      icon: Store,
      href: "/dashboard/restaurants",
      roles: ["admin", "manager"],
    },
    {
      title: t("orders"),
      icon: ShoppingBag,
      href: "/dashboard/orders",
      roles: ["admin", "manager", "staff"],
    },
    {
      title: t("users"),
      icon: Users,
      href: "/dashboard/users",
      roles: ["admin", "manager"],
    },
    {
      title: t("categories"),
      icon: FolderTree,
      href: "/dashboard/categories",
      roles: ["admin"],
    },
    {
      title: t("products"),
      icon: Package,
      href: "/dashboard/products",
      roles: ["admin", "manager"],
    },
    {
      title: t("offers"),
      icon: Percent,
      href: "/dashboard/offers",
      roles: ["manager"],
    },
    {
      title: t("ingredients"),
      icon: Carrot,
      href: "/dashboard/ingredients",
      roles: ["manager"],
    },
    {
      title: t("recipes"),
      icon: ChefHat,
      href: "/dashboard/recipes",
      roles: ["manager"],
    },

    // Section 3: Settings
    { label: t("settings"), isSection: true },
    {
      title: t("accountSettings"),
      icon: Settings,
      href: "/dashboard/profile",
      roles: ["admin", "manager", "staff", "customer"],
    },
  ]

  return filterNavByRole(rawNav, role, isHydrated)
}

const AppSidebar = ({ children }: { children: React.ReactNode }) => {
  const navData = useDashboardNav()
  const locale = useLocale()
  const isEN = locale === "en"

  return (
    <SidebarProvider>
      <Sidebar
        side={isEN ? "left" : "right"}
        className="bg-background px-0"
      >
        <div className="flex h-full flex-col gap-4 bg-background py-4">
          {/* ---------------- Header ---------------- */}
          <SidebarHeader className="px-4 py-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link
                  href="/"
                  className="flex h-full w-full items-center justify-start"
                >
                  <Image
                    src="/images/logo.webp"
                    alt="RestoMind Logo"
                    height={40}
                    width={120}
                    priority
                    className="h-9 w-auto object-contain"
                  />
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* ---------------- Content ---------------- */}
          <SidebarContent className="flex-1 gap-0 overflow-hidden px-3">
            <SimpleBar
              autoHide={true}
              className="h-full"
            >
              <div className="space-y-1.5 py-2">
                <NavMain items={navData} />
              </div>
            </SimpleBar>
          </SidebarContent>
        </div>
      </Sidebar>

      {/* ---------------- Main ---------------- */}
      <div className="flex w-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex items-center border-b bg-background px-4 py-3 sm:px-6">
          <SiteHeader />
        </header>
        <main className="w-full min-w-0 flex-1">{children}</main>
      </div>
    </SidebarProvider>
  )
}

export default AppSidebar
