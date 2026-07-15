"use client"

import * as React from "react"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export type ActLinkProps = React.ComponentProps<typeof Link> & {
  activeClassName?: string
  inactiveClassName?: string
}

export default function ActLink({
  href,
  className,
  activeClassName,
  inactiveClassName,
  children,
  ...props
}: ActLinkProps) {
  const pathname = usePathname()

  // Safely extract string href
  const hrefString = typeof href === "string" ? href : href.pathname || ""

  activeClassName = activeClassName || "bg-accent text-accent-foreground"
  inactiveClassName =
    inactiveClassName ||
    "text-muted-foreground hover:bg-accent/50 hover:text-foreground"

  const isActive =
    pathname === hrefString ||
    (hrefString !== "/" && pathname?.startsWith(hrefString))

  return (
    <Link
      href={href}
      className={cn(className, isActive ? activeClassName : inactiveClassName)}
      {...props}
    >
      {children}
    </Link>
  )
}
