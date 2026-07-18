import { Geist_Mono, Outfit, Oxanium, Cairo } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"

import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { routing } from "@/i18n/routing"
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import LocaleHtml from "@/components/locale-html"

const oxaniumHeading = Oxanium({
  subsets: ["latin"],
  variable: "--font-heading",
})
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound()
  }

  // Load messages for the provider
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {/* sets lang + dir on <html> client-side; dir is also on the div below for SSR CSS */}
      <LocaleHtml locale={locale} />
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          outfit.variable,
          oxaniumHeading.variable,
          cairo.variable
        )}
      >
        <ThemeProvider>
          <TooltipProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </TooltipProvider>
        </ThemeProvider>
      </div>
    </NextIntlClientProvider>
  )
}
