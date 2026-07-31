"use client"

import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { NavItem } from "@/components/shadcn-space/blocks/dashboard-shell-01/app-sidebar"
import { cn } from "@/lib/utils"
import { usePathname, useSearchParams } from "next/navigation"
import { Link } from "@/i18n/routing"

/**
 * Pure helper — given an item's href, the current pathname, and the current
 * search params, returns whether the item should render as "active".
 *
 * - When href contains a `?tab=...` query, both pathname and tab must match.
 * - When href has no query, the current path must equal href exactly (so
 *   "/dashboard" stays active on `/dashboard` but not on
 *   `/dashboard/profile`, letting child items claim active state).
 */
/**
 * Pure helper — given an item's href, the current pathname, and the current
 * search params, returns whether the item should render as "active".
 *
 * Strips locale prefixes (e.g. /en or /ar) so /en/dashboard/restaurants matches /dashboard/restaurants.
 */
function isActive(
  href: string | undefined,
  rawPathname: string,
  searchParams: URLSearchParams
): boolean {
  if (!href) return false
  const pathname = rawPathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/"
  const [itemPath, itemQuery] = href.split("?")

  if (itemPath === "/dashboard") {
    if (!itemQuery) return pathname === "/dashboard"
    const itemTab = new URLSearchParams(itemQuery).get("tab")
    return pathname === "/dashboard" && itemTab === searchParams.get("tab")
  }

  if (pathname === itemPath || pathname.startsWith(`${itemPath}/`)) {
    if (!itemQuery) return true
    const itemTab = new URLSearchParams(itemQuery).get("tab")
    return itemTab === searchParams.get("tab")
  }

  return false
}

/**
 * Helper to check if any child (or descendant) in a NavItem tree is currently active.
 */
function isTreeActive(
  item: NavItem,
  rawPathname: string,
  searchParams: URLSearchParams
): boolean {
  if (isActive(item.href, rawPathname, searchParams)) return true
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => isTreeActive(child, rawPathname, searchParams))
  }
  return false
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const computeActive = (href?: string): boolean =>
    isActive(href, pathname ?? "", searchParams)

  const computeTreeActive = (item: NavItem): boolean =>
    isTreeActive(item, pathname ?? "", searchParams)

  // Recursive render function for sub-items
  const renderItemSub = (item: NavItem, idx: number) => {
    const hasChildren = !!item.children?.length
    if (hasChildren && item.title) {
      const isAnyChildActive = computeTreeActive(item)
      return (
        <SidebarMenuSubItem key={`subgroup-${item.title}-${idx}`}>
          <Collapsible defaultOpen={isAnyChildActive}>
            <CollapsibleTrigger
              render={
                <SidebarMenuSubButton className="h-8.5 w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors justify-between text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <item.icon className="size-3.5 shrink-0" />}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <ChevronRight className="collapsible/button-[aria-expanded='true']:rotate-90 size-3.5 shrink-0 transition-transform duration-200" />
                </SidebarMenuSubButton>
              }
              className="collapsible/button w-full"
            />
            <CollapsibleContent>
              <SidebarMenuSub className="me-0 pe-0 space-y-1 pt-1">
                {item.children!.map(renderItemSub)}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuSubItem>
      )
    }
    if (item.title) {
      const active = item.isActive ?? computeActive(item.href)
      return (
        <SidebarMenuSubItem
          key={`subitem-${item.title}-${item.href}-${idx}`}
          className="w-full"
        >
          <SidebarMenuSubButton
            render={<Link href={item.href || "#"} />}
            isActive={active}
            className={cn(
              "h-8.5 w-full rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors gap-2",
              active
                ? "bg-primary/15 font-semibold text-primary shadow-2xs hover:bg-primary/20 hover:text-primary"
                : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
            )}
          >
            {item.icon && <item.icon className="size-3.5 shrink-0" />}
            <span className="truncate">{item.title}</span>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )
    }
    return null
  }

  // Primary item render function
  const renderItem = (item: NavItem, idx: number) => {
    //  Section label
    if (item.isSection && item.label) {
      return (
        <SidebarGroup
          key={`sec-${item.label}-${idx}`}
          className="p-0 pt-4 pb-1.5 first:pt-0"
        >
          <SidebarGroupLabel className="h-auto px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {item.label}
          </SidebarGroupLabel>
        </SidebarGroup>
      )
    }
    const hasChildren = !!item.children?.length
    // Item with children → collapsible
    if (hasChildren && item.title) {
      const isAnyChildActive = computeTreeActive(item)
      return (
        <SidebarGroup key={`group-${item.title}-${idx}`} className="p-0 my-0.5">
          <SidebarMenu>
            <Collapsible defaultOpen={isAnyChildActive}>
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={cn(
                        "h-9.5 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors gap-2.5",
                        isAnyChildActive
                          ? "font-semibold text-foreground bg-accent/50"
                          : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="size-4 shrink-0" />}
                      <span>{item.title}</span>
                      <ChevronRight className="collapsible/button-[aria-expanded='true']:rotate-90 ml-auto size-4 transition-transform duration-200" />
                    </SidebarMenuButton>
                  }
                  className="collapsible/button w-full"
                />
                <CollapsibleContent>
                  <SidebarMenuSub className="me-0 pe-0 space-y-1 pt-1">
                    {item.children!.map(renderItemSub)}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      )
    }
    // Item without children
    if (item.title) {
      const active = item.isActive ?? computeActive(item.href)

      return (
        <SidebarGroup
          key={`item-${item.title}-${item.href}-${idx}`}
          className="p-0 my-0.5"
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href={item.href || "#"} />}
                tooltip={item.title}
                className={cn(
                  "h-9.5 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors gap-2.5",
                  active
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                )}
              >
                {item.icon && <item.icon className="size-4 shrink-0" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )
    }
    return null
  }

  return <>{items.map((item, idx) => renderItem(item, idx))}</>
}
