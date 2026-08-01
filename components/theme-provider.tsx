"use client"

import * as React from "react"
import { NextThemeProvider, useTheme } from "@space-man/react-theme-animation"
import type { Theme } from "@space-man/react-theme-animation"

import { Toaster } from "@/components/ui/sonner"

// Suppress the React 19 "Encountered a script tag" warning
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return
    }
    orig.apply(console, args)
  }
}

const VALID_THEMES: Theme[] = ["light", "dark", "system"]

/**
 * Keeps the theme in sync across locale navigations.
 *
 * Next.js App Router maintains **separate component instances** for each value
 * of the `[locale]` dynamic segment.  Each instance has its own ThemeProvider
 * React state, so switching locales can surface a stale cached theme.
 *
 * This guard does two things on every mount / render:
 *  1. `useLayoutEffect` — applies the correct `dark` class to `<html>` from
 *     localStorage **before paint**, preventing a visual flash.
 *  2. Calls the library's `setTheme()` when its internal state diverges from
 *     localStorage, so the library's own effects don't override the DOM fix.
 */
function ThemeSyncGuard({ storageKey = "theme" }: { storageKey?: string }) {
  const { theme, setTheme } = useTheme()

  React.useLayoutEffect(() => {
    try {
      const d = document.documentElement
      const raw = localStorage.getItem(storageKey)
      const stored: Theme =
        raw && VALID_THEMES.includes(raw as Theme)
          ? (raw as Theme)
          : "system"
      const resolved =
        stored === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : stored

      // 1. Patch the DOM immediately (before paint)
      if (resolved === "dark") {
        d.classList.add("dark")
      } else {
        d.classList.remove("dark")
      }
      d.style.colorScheme = resolved

      // 2. Sync the library's internal React state so its own effects
      //    don't overwrite the DOM fix with a stale value.
      if (stored !== theme) {
        setTheme(stored)
      }
    } catch {
      // localStorage may throw in restricted contexts — ignore
    }
  })

  return null
}

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemeProvider>) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSyncGuard />
      <ThemeHotkey />
      {children}
      <Toaster position="top-center" richColors />
    </NextThemeProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (!event.key || event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
