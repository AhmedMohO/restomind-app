"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { useTranslations } from "next-intl"
import ActLink from "@/components/common/ActLink"
import LangToggle from "@/components/common/LangToggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"

export default function MobileMenu() {
  const t = useTranslations("Navbar")

  const links = [
    { key: "home", href: "/" },
    { key: "offers", href: "/offers" },
    { key: "dashboard", href: "/dashboard" },
    { key: "about", href: "/about" },
  ] as const

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Open mobile menu"
            nativeButton
          >
            <Menu className="size-4" />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[300px] p-6">
        <SheetHeader className="mt-4 mb-8 flex flex-row items-center justify-between">
          <SheetTitle className="text-left font-heading text-xl rtl:text-right">
            Menu
          </SheetTitle>
          <div className="pe-8">
            <LangToggle />
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <SheetClose
                key={link.key}
                nativeButton={false}
                render={
                  <ActLink
                    href={link.href}
                    className="block rounded-lg px-4 py-2.5 text-start text-base font-medium transition-colors"
                    activeClassName="bg-accent text-accent-foreground"
                    inactiveClassName="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  >
                    {t(link.key)}
                  </ActLink>
                }
              />
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
