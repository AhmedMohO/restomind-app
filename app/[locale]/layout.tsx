import { Geist_Mono, Outfit, Oxanium, Cairo } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"

import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { routing } from "@/i18n/routing"

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
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        outfit.variable,
        oxaniumHeading.variable,
        cairo.variable
      )}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
