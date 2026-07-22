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

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const computeActive = (href?: string): boolean =>
    isActive(href, pathname ?? "", searchParams)

  // Recursive render function
  const renderItem = (item: NavItem, idx: number) => {
    //  Section label
    if (item.isSection && item.label) {
      return (
        <SidebarGroup
          key={`sec-${item.label}-${idx}`}
          className="p-0 pt-4 pb-1 first:pt-0"
        >
          <SidebarGroupLabel className="h-auto px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
            {item.label}
          </SidebarGroupLabel>
        </SidebarGroup>
      )
    }
    const hasChildren = !!item.children?.length
    // Item with children → collapsible
    if (hasChildren && item.title) {
      return (
        <SidebarGroup key={`group-${item.title}-${idx}`} className="p-0 my-0.5">
          <SidebarMenu>
            <Collapsible>
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="h-9.5 cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors gap-2.5 text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
                    >
                      {item.icon && <item.icon className="size-4 shrink-0" />}
                      <span>{item.title}</span>
                      <ChevronRight className="collapsible/button-[aria-expanded='true']:rotate-90 ml-auto size-4 transition-transform duration-200" />
                    </SidebarMenuButton>
                  }
                  className="collapsible/button w-full"
                />
                <CollapsibleContent>
                  <SidebarMenuSub className="me-0 pe-0 space-y-1">
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
  // Recursive render function for sub-items
  const renderItemSub = (item: NavItem, idx: number) => {
    const hasChildren = !!item.children?.length
    if (hasChildren && item.title) {
      return (
        <SidebarMenuSubItem key={`subgroup-${item.title}-${idx}`}>
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <SidebarMenuSubButton className="h-9 rounded-xl px-3 py-2 text-sm">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 data-[state=open]:rotate-90" />
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="me-0 pe-0">
                {item.children!.map(renderItemSub)}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuSubItem>
      )
    }
    if (item.title) {
      return (
        <SidebarMenuSubItem
          key={`subitem-${item.title}-${item.href}-${idx}`}
          className="w-full"
        >
          <SidebarMenuSubButton
            className="w-full"
            render={<Link href={item.href || "#"}>{item.title}</Link>}
          />
        </SidebarMenuSubItem>
      )
    }
    return null
  }

  return <>{items.map((item, idx) => renderItem(item, idx))}</>
}
