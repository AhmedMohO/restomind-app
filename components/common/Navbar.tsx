import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import MobileMenu from "@/components/common/MobileMenu"
import LangToggle from "@/components/common/LangToggle"
import ActLink from "@/components/common/ActLink"

export default function Navbar() {
  const t = useTranslations("Navbar")

  const navLinks = [
    { key: "home", href: "/" },
    { key: "offers", href: "/offers" },
    { key: "about", href: "/about" },
    { key: "dashboard", href: "/dashboard" },
  ] as const

  return (
    <header className="relative z-50 w-full bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 md:grid md:grid-cols-3 md:px-8">
        {/* Left: Navigation links (hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex md:justify-start">
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
        <div className="flex justify-start md:justify-center">
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

        {/* Right: Theme Toggle & Mobile Menu */}
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <LangToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
