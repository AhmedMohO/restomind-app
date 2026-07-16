import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import MobileMenu from "@/components/common/MobileMenu"
import LangToggle from "@/components/common/LangToggle"
import ActLink from "@/components/common/ActLink"
import CartSheet from "@/components/common/CartSheet"
import { buttonVariants } from "@/components/ui/button"

export default function Navbar() {
  const t = useTranslations("Navbar")

  const navLinks = [
    { key: "home", href: "/" },
    { key: "offers", href: "/offers" },
    { key: "orders", href: "/orders" },
    { key: "about", href: "/about" },
  ] as const

  return (
    <header className="relative z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 lg:grid lg:grid-cols-3 lg:px-8">
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
          {/* Desktop Auth Links */}
          <div className="hidden items-center gap-2 md:flex">
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
