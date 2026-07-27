"use client"

import { Menu, LogOut, LayoutDashboard, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import ActLink from "@/components/common/ActLink"
import LangToggle from "@/components/common/LangToggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { SignedIn, SignedOut, HasRole } from "@/features/auth/components/Guards"
import { logoutAction } from "@/features/auth/actions/login"
import { useQueryClient } from "@tanstack/react-query"
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
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()

  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const links = [
    { key: "home", href: "/" },
    { key: "offers", href: "/offers" },
    { key: "orders", href: "/orders" },
    { key: "favourites", href: "/favourites" },
    { key: "about", href: "/about" },
  ] as const

  async function handleLogout() {
    await logoutAction()
    setUser(null)
    queryClient.clear()
    router.push("/login")
    router.refresh()
  }

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
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="w-[300px] p-6"
      >
        <SheetHeader className="mt-4 mb-6 flex flex-row items-center justify-between">
          <SheetTitle className="text-left font-heading text-xl rtl:text-right">
            Menu
          </SheetTitle>
          <div className="pe-8">
            <LangToggle />
          </div>
        </SheetHeader>

        {/* User Card Header when logged in */}
        <SignedIn>
          <div className="mb-6 rounded-xl border border-border/60 bg-muted/40 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </SignedIn>

        <div className="flex flex-col gap-6">
          <nav className="flex flex-col gap-2">
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

            <SignedIn>
              <SheetClose
                nativeButton={false}
                render={
                  <ActLink
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-start text-base font-medium transition-colors"
                    activeClassName="bg-accent text-accent-foreground"
                    inactiveClassName="text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    <User className="size-4" />
                    <span>{t("profile")}</span>
                  </ActLink>
                }
              />
            </SignedIn>

            <HasRole roles={["admin", "manager"]}>
              <SheetClose
                nativeButton={false}
                render={
                  <ActLink
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-start text-base font-medium transition-colors"
                    activeClassName="bg-accent text-accent-foreground"
                    inactiveClassName="text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  >
                    <LayoutDashboard className="size-4" />
                    <span>{t("dashboard")}</span>
                  </ActLink>
                }
              />
            </HasRole>
          </nav>

          {/* Divider */}
          <div className="dark:bg-stone-850 h-px w-full bg-border/60" />

          {/* Mobile Auth Actions */}
          <div className="flex flex-col gap-3">
            <SignedIn>
              <SheetClose
                nativeButton
                render={
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-semibold"
                  >
                    <LogOut className="size-4" />
                    <span>{t("logout")}</span>
                  </Button>
                }
              />
            </SignedIn>
            <SignedOut>
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
                  <Link
                    href="/register"
                    className="flex h-10 w-full items-center justify-center rounded-full border border-stone-300 text-sm font-semibold tracking-wider text-stone-900 uppercase transition-all dark:border-stone-800 dark:text-stone-100 dark:hover:bg-stone-900"
                  >
                    {t("register")}
                  </Link>
                }
              />
            </SignedOut>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
