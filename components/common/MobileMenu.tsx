"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
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
                    inactiveClassName="text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    {t(link.key)}
                  </ActLink>
                }
              />
            ))}
          </nav>

          {/* Divider */}
          <div className="dark:bg-stone-850 h-px w-full bg-border/60" />

          {/* Mobile Auth Actions */}
          <div className="flex flex-col gap-3">
            <SheetClose
              nativeButton={false}
              render={
                <Link
                  href="/login"
                  className="flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                >
                  {t("login")}
                </Link>
              }
            />
            <SheetClose
              nativeButton={false}
              render={
                <Link href="/register" passHref className="w-full">
                  <Button
                    variant="outline"
                    className="h-10 w-full cursor-pointer rounded-full border-stone-300 text-sm font-semibold tracking-wider text-stone-900 uppercase transition-all dark:border-stone-800 dark:text-stone-100 dark:hover:bg-stone-900"
                  >
                    {t("register")}
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
