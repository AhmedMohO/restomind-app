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
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  Carrot,
  ChefHat,
  FileText,
  FolderTree,
  Layers,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  SlidersHorizontal,
  Undo2,
  Wallet,
  CreditCard,
  Sparkles,
  Store,
  Settings,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react"

import { SiteHeader } from "@/components/shadcn-space/blocks/dashboard-shell-01/site-header"
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
 * Edge-case resilient role checking helper.
 */
function isRoleAllowed(
  allowedRoles: UserRole[] | undefined,
  userRole: UserRole | null,
  isHydrated: boolean
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true
  if (userRole !== null) {
    return allowedRoles.includes(userRole)
  }
  // When hydrated and userRole is null (unauthenticated / guest), disallow protected routes
  if (isHydrated) {
    return false
  }
  return true
}

/**
 * Filter nav items and section headers according to the user's role.
 * Handles edge cases:
 * 1. Disallowed parent roles automatically prune all children.
 * 2. Containers with no href whose children are all filtered out get pruned.
 * 3. Parents with an href whose children get filtered out revert to flat items.
 * 4. Empty or orphan section headers (sections with zero allowed items) are automatically omitted.
 */
function filterNavByRole(
  items: NavItem[],
  userRole: UserRole | null,
  isHydrated: boolean
): NavItem[] {
  const step1: NavItem[] = []

  for (const item of items) {
    if (item.isSection) {
      step1.push({ ...item })
      continue
    }

    // Check item level role permission
    if (!isRoleAllowed(item.roles, userRole, isHydrated)) {
      continue
    }

    // Process children recursively if any
    let filteredChildren: NavItem[] | undefined = undefined
    if (item.children && item.children.length > 0) {
      const childResults = filterNavByRole(item.children, userRole, isHydrated)
      if (childResults.length > 0) {
        filteredChildren = childResults
      } else {
        // If parent has no href and all children were pruned, prune parent
        if (!item.href) {
          continue
        }
        filteredChildren = undefined
      }
    }

    step1.push({
      ...item,
      children: filteredChildren,
    })
  }

  // Step 2: Remove empty/orphan section headers
  const result: NavItem[] = []
  let pendingSectionHeader: NavItem | null = null

  for (const item of step1) {
    if (item.isSection) {
      pendingSectionHeader = item
    } else {
      if (pendingSectionHeader) {
        result.push(pendingSectionHeader)
        pendingSectionHeader = null
      }
      result.push(item)
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

    // Section 2: Administration
    { label: t("administration"), isSection: true },
    {
      title: role === "admin" ? t("restaurants") : t("restaurantProfile"),
      icon: Store,
      href: "/dashboard/restaurants",
      roles: ["admin", "manager"],
    },
    {
      title: t("users"),
      icon: Users,
      href: "/dashboard/users",
      roles: ["admin", "manager"],
    },
    {
      title: t("partnershipApplications"),
      icon: FileText,
      href: "/dashboard/partnership-applications",
      roles: ["admin"],
    },
    {
      title: t("subscriptionPlans"),
      icon: Layers,
      href: "/dashboard/admin/plans",
      roles: ["admin"],
    },
    {
      title: t("platformSettings"),
      icon: SlidersHorizontal,
      href: "/dashboard/admin/settings",
      roles: ["admin"],
    },
    {
      title: t("orders"),
      icon: ShoppingBag,
      href: "/dashboard/orders",
      roles: ["admin", "manager", "staff"],
    },
    {
      title: t("refunds"),
      icon: Undo2,
      href: "/dashboard/refunds",
      roles: ["admin", "manager", "staff"],
    },
    {
      title: t("payouts"),
      icon: Wallet,
      href: "/dashboard/payouts",
      roles: ["admin", "manager", "staff"],
    },
    // Billing is deliberately absent. It is not day-to-day work, and the
    // paths that matter already lead there: the subscription banner, the
    // paywall, and the trial countdown. A permanent "pay" item in the nav of
    // a merchant who has already paid only invites a second purchase.
    {
      title: t("imports"),
      icon: Upload,
      href: "/dashboard/imports",
      roles: ["manager"],
    },

    // Section 3: AI & Intelligence
    { label: t("aiIntelligence"), isSection: true },
    {
      title: t("predictions"),
      icon: TrendingUp,
      href: "/dashboard/predictions",
      roles: ["manager"],
    },
    {
      title: t("recommendations"),
      icon: Sparkles,
      href: "/dashboard/recommendations",
      roles: ["manager"],
    },
    {
      title: t("productionPlan"),
      icon: CalendarClock,
      href: "/dashboard/production-plan",
      roles: ["manager", "staff"],
    },
    {
      title: t("waste"),
      icon: Trash2,
      href: "/dashboard/waste",
      roles: ["manager"],
    },

    // Section 4: Menu & Catalog
    { label: t("catalog"), isSection: true },
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
      roles: ["admin", "manager", "staff"],
    },
    {
      title: t("offers"),
      icon: Percent,
      href: "/dashboard/offers",
      roles: ["admin", "manager", "staff"],
    },
    {
      title: t("recipes"),
      icon: ChefHat,
      href: "/dashboard/recipes",
      roles: ["manager"],
    },

    // Section 5: Inventory & Supply
    { label: t("inventoryOps"), isSection: true },
    {
      title: t("inventory"),
      icon: Boxes,
      href: "/dashboard/inventory",
      roles: ["manager", "staff"],
    },
    {
      title: t("ingredients"),
      icon: Carrot,
      href: "/dashboard/ingredients",
      roles: ["manager", "staff"],
    },
    {
      title: t("purchaseOrders"),
      icon: Truck,
      href: "/dashboard/purchase-orders",
      roles: ["manager", "staff"],
    },
    {
      title: t("suppliers"),
      icon: Building2,
      href: "/dashboard/suppliers",
      roles: ["manager", "staff"],
    },

    // Section 6: Settings
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

interface AppSidebarProps {
  children: React.ReactNode
  needsSubscription?: boolean
}

const AppSidebar = ({
  children,
  needsSubscription = false,
}: AppSidebarProps) => {
  const navData = useDashboardNav()
  const locale = useLocale()
  const isEN = locale === "en"

  return (
    <SidebarProvider
      defaultOpen={!needsSubscription}
      open={needsSubscription ? false : undefined}
      disabled={needsSubscription}
    >
      <Sidebar side={isEN ? "left" : "right"} className="bg-background px-0">
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
            <div className="scrollbar-hide space-y-1.5 overflow-y-auto py-2">
              <NavMain items={navData} />
            </div>
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
