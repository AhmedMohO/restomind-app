"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import MobileMenu from "@/components/common/MobileMenu"
import LangToggle from "@/components/common/LangToggle"
import ActLink from "@/components/common/ActLink"
import CartSheet from "@/components/common/CartSheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store/useAuthStore"
import { SignedIn, SignedOut, HasRole } from "@/features/auth/components/Guards"
import { logoutAction } from "@/features/auth/actions/login"
import { useQueryClient } from "@tanstack/react-query"
import { User, LogOut, LayoutDashboard, Heart, ShoppingBag } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Navbar() {
  const t = useTranslations("Navbar")
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const isLandingPage =
    pathname === "/" || pathname === "/en" || pathname === "/ar"

  const navLinks = [
    { key: "home", href: "/" },
    { key: "offers", href: "/offers" },
    { key: "orders", href: "/orders" },
    { key: "favourites", href: "/favourites" },
    { key: "about", href: "/about" },
  ] as const

  async function handleLogout() {
    await logoutAction()
    setUser(null)
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    router.refresh()
  }

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : ""

  return (
    <header
      className={cn(
        "relative z-50 w-full bg-transparent",
        isLandingPage && "absolute"
      )}
    >
      <div className="max-w-9xl mx-auto flex items-center justify-between px-4 py-6 lg:grid lg:grid-cols-3 lg:px-8">
        {/* Left: Navigation links (hidden on mobile, visible on desktop) */}
        <div className="hidden lg:flex lg:justify-start">
          <nav className="flex items-center gap-1 rounded-full border border-border/40 bg-background/50 p-1.5 backdrop-blur-md">
            {navLinks.map((link) => (
              <ActLink
                key={link.key}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200"
                activeClassName="bg-accent text-accent-foreground"
                inactiveClassName="text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              >
                {t(link.key)}
              </ActLink>
            ))}
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-start lg:justify-center">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <Image
              src="/images/logo.webp"
              alt="Pantry Logo"
              height={50}
              width={140}
              priority
              className="w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right: Auth links, Utilities, Mobile Menu */}
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          {/* Desktop Auth Links / User Profile */}
          <div className="hidden items-center gap-2 md:flex">
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 rounded-full border-border/60 bg-background/80 px-3 py-1.5 shadow-xs backdrop-blur-sm transition-all hover:bg-accent"
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {userInitials || <User className="size-3.5" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[120px] truncate text-sm font-medium">
                        {user?.firstName}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-md p-2"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <HasRole roles={["admin", "manager"]}>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      className="cursor-pointer gap-2 py-2"
                    >
                      <LayoutDashboard className="size-4 text-muted-foreground" />
                      <span>{t("dashboard")}</span>
                    </DropdownMenuItem>
                  </HasRole>
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <User className="size-4 text-muted-foreground" />
                    <span>{t("profile")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/orders")}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <ShoppingBag className="size-4 text-muted-foreground" />
                    <span>{t("orders")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/favourites")}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <Heart className="size-4 text-muted-foreground" />
                    <span>{t("favourites")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                    className="cursor-pointer gap-2 py-2"
                  >
                    <LogOut className="size-4" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedIn>
            <SignedOut>
              <ActLink
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                })}
              >
                {t("login")}
              </ActLink>
              <ActLink
                className={buttonVariants({
                  variant: "outline",
                })}
                href="/register"
              >
                {t("register")}
              </ActLink>
            </SignedOut>
          </div>

          {/* System Utilities */}
          <div className="flex items-center gap-1.5 border-l border-border/40 pl-3 rtl:border-r rtl:border-l-0 rtl:pr-3 rtl:pl-0 dark:border-stone-800">
            <ThemeToggle />
            <CartSheet />
            <LangToggle />
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
