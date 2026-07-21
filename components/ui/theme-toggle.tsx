"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useThemeAnimation } from "@space-man/react-theme-animation"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, toggleTheme, ref } = useThemeAnimation({
    defaultTheme: "system",
  })

  if (typeof window !== "undefined" && !mounted) {
    setMounted(true)
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
      >
        <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      onClick={() => toggleTheme()}
    >
      {theme === "light" ? (
        <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      ) : (
        <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
