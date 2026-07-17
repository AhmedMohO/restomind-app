"use client"

import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import LangToggle from "@/components/common/LangToggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function LoginPage() {
  const t = useTranslations("Auth")

  return (
    <div className="grid min-h-svh bg-background select-none lg:grid-cols-2">
      {/* Form panel */}
      <div className="flex flex-col p-6 md:p-10">
        {/* Auth Page Header */}
        <div className="flex w-full items-center justify-between">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-90"
          >
            <Image
              src="/images/logo.webp"
              alt={t("logoAlt")}
              height={40}
              width={120}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-card p-6 shadow-xs md:p-8">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Visual panel */}
      <div className="relative hidden overflow-hidden bg-muted lg:block">
        <Image
          src="/images/auth-bg.png"
          alt="RestoMind Visuals"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out dark:brightness-[0.45]"
          width={1920}
          height={1080}
          priority
        />
        {/* Overlay with glassmorphic styling */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-neutral-950/85 via-neutral-950/40 to-transparent p-12 text-white">
          <div className="max-w-md space-y-3 rounded-2xl border border-white/10 bg-neutral-950/20 p-6 shadow-lg backdrop-blur-xs">
            <h2 className="font-heading text-3xl font-extrabold tracking-wide">
              RestoMind
            </h2>
            <p className="text-md leading-relaxed text-neutral-200">
              {t("imageTagline")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
