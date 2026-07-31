import type { Metadata } from "next"
import { Geist_Mono, Outfit, Oxanium, Cairo } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import "../globals.css"
import { ScrollToTop } from "@/components/scroll-to-top"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { routing } from "@/i18n/routing"
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import QueryProvider from "@/providers/use-query-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { ZodLocaleProvider } from "@/providers/zod-locale-provider"
import { organizationJsonLd } from "@/lib/seo/json-ld"

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const currentPath = `/${locale}`
  const enPath = `/en`
  const arPath = `/ar`

  const keywordsString = t("keywords")
  const keywordsArray = keywordsString
    ? keywordsString.split(",").map((k: string) => k.trim())
    : []

  return {
    metadataBase: new URL(baseUrl),
    applicationName: "RestoMind",
    title: {
      default: t("title"),
      template: `%s | RestoMind`,
    },
    description: t("description"),
    keywords: keywordsArray,
    alternates: {
      canonical: currentPath,
      languages: {
        en: enPath,
        ar: arPath,
        "x-default": enPath,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${baseUrl}/${locale}`,
      siteName: "RestoMind",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
      images: [
        {
          url: "/images/logo.webp",
          width: 512,
          height: 512,
          alt: "RestoMind Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/images/logo.webp"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "32x32" }],
      apple: [
        { url: "/images/logo.webp", sizes: "192x192", type: "image/webp" },
      ],
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  setRequestLocale(locale)

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound()
  }

  const dir = locale === "ar" ? "rtl" : "ltr"
  const orgSchema = organizationJsonLd()

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme')||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;if(r==='dark'){d.classList.add('dark')}else{d.classList.remove('dark')}d.style.colorScheme=r}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <TooltipProvider>
                <SmoothScrollProvider>
                  <Suspense fallback={null}>
                    <LocaleMessages>
                      <ScrollToTop />
                      {children}
                    </LocaleMessages>
                  </Suspense>
                </SmoothScrollProvider>
              </TooltipProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

async function LocaleMessages({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      <ZodLocaleProvider>{children}</ZodLocaleProvider>
    </NextIntlClientProvider>
  )
}
