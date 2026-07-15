import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import Image from "next/image"
import {
  Facebook,
  Instagram,
  Linkedin,
  PinterestIcon,
  X,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export default function Footer() {
  const t = useTranslations("Footer")
  const tNavbar = useTranslations("Navbar")

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: <HugeiconsIcon icon={Instagram} />,
    },
    {
      name: "Facebook",
      href: "https://facebook.com",
      icon: <HugeiconsIcon icon={Facebook} />,
    },
    {
      name: "Pinterest",
      href: "https://pinterest.com",
      icon: <HugeiconsIcon icon={PinterestIcon} />,
    },
    {
      name: "X",
      href: "https://x.com",
      icon: <HugeiconsIcon icon={X} />,
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com",
      icon: <HugeiconsIcon icon={Linkedin} />,
    },
  ]

  return (
    <footer className="relative mt-20 w-full overflow-hidden border-t border-stone-200 bg-[#FAF7F2] py-16 transition-colors duration-300 sm:py-20 dark:border-stone-900/60 dark:bg-[#151413]">
      {/* Cookie background watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply select-none dark:opacity-[0.02] dark:mix-blend-normal">
        <Image
          src="/images/Landing/hero.webp"
          alt="Background Watermark"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Grid: Newsletter + Quick Links */}
        <div className="grid grid-cols-1 gap-12 border-b border-stone-200 pb-16 lg:grid-cols-12 lg:gap-8 dark:border-stone-900/60">
          {/* Newsletter Column */}
          <div className="space-y-6 lg:col-span-5">
            <h3 className="font-serif text-3xl leading-tight font-bold tracking-tight text-[#111111] sm:text-4xl dark:text-stone-100">
              {t("joinNewsletter")}
            </h3>
            <form className="flex w-full max-w-md items-center rounded-full border border-stone-200 bg-white p-1 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/45 dark:border-stone-800 dark:bg-stone-900/90">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="flex-1 border-none bg-transparent px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none dark:text-stone-100 dark:placeholder-stone-500"
                required
              />
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-[#111111] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-stone-800 active:scale-95 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100"
              >
                {t("subscribe")}
              </button>
            </form>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:col-span-7 lg:justify-items-end">
            {/* Column 1: Explore */}
            <div className="min-w-[120px] space-y-5">
              <h4 className="font-sans text-xs font-bold tracking-widest text-[#8A8A8A] uppercase dark:text-stone-500">
                {t("menuTitle")}
              </h4>
              <ul className="space-y-3.5 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {tNavbar("home")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/offers"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {tNavbar("offers")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {tNavbar("about")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {tNavbar("dashboard")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Legal / Company */}
            <div className="min-w-[120px] space-y-5">
              <h4 className="font-sans text-xs font-bold tracking-widest text-[#8A8A8A] uppercase dark:text-stone-500">
                {t("infoTitle")}
              </h4>
              <ul className="space-y-3.5 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {t("contact")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {t("faq")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-stone-600 transition-colors hover:text-[#111111] dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Giant Logo + Project Description / Socials */}
        <div className="flex flex-col items-start justify-between gap-8 pt-12 md:flex-row md:items-end">
          {/* Huge Brand Text (Always LTR English Logo) */}
          <div dir="ltr" className="leading-none select-none">
            <span className="font-serif text-[11vw] leading-[0.8] font-black tracking-tighter text-[#111111] sm:text-[9vw] md:text-[7vw] lg:text-[7.5rem] dark:text-stone-100">
              RestroMind
            </span>
          </div>

          {/* Description & Social Media Icons */}
          <div className="max-w-sm space-y-5 text-start md:ms-auto md:text-end">
            <p className="text-sm leading-relaxed font-medium text-stone-600 dark:text-stone-400">
              {t("description")}
            </p>
            <div className="flex items-center justify-start gap-3 md:justify-end">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#111111] text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg dark:bg-white dark:text-stone-950"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Fine Print Copyright Bar */}
        <div className="mt-16 flex flex-col items-center justify-between border-t border-stone-200/60 pt-8 text-xs text-stone-500 sm:flex-row dark:border-stone-900/40 dark:text-stone-500">
          <p>
            © {new Date().getFullYear()} RestroMind. {t("rights")}
          </p>
          <p className="mt-2 sm:mt-0">Made with ❤️ in Cairo, Egypt</p>
        </div>
      </div>
    </footer>
  )
}
