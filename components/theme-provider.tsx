"use client"

import * as React from "react"
import { NextThemeProvider, useTheme } from "@space-man/react-theme-animation"

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
      <ThemeGuard />
      <ThemeHotkey />
      {children}
      <Toaster position="top-center" richColors />
    </NextThemeProvider>
  )
}

/**
 * Re-applies the correct theme class on <html> after every React commit.
 *
 * When the locale changes, Next.js streams new server-rendered HTML that
 * overwrites <html>'s className (stripping "dark"). useLayoutEffect runs
 * synchronously BEFORE the browser paints, so the user never sees the
 * wrong theme — even during soft navigations.
 */
function ThemeGuard() {
  const { resolvedTheme } = useTheme()

  // No dependency array → runs after every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    const el = document.documentElement
    if (resolvedTheme === "dark") {
      if (!el.classList.contains("dark")) el.classList.add("dark")
      el.style.colorScheme = "dark"
    } else {
      if (el.classList.contains("dark")) el.classList.remove("dark")
      el.style.colorScheme = "light"
    }
  })

  return null
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
