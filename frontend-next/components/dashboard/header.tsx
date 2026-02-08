"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Bell, Lock, Shield, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const [time, setTime] = useState("")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const isDark = theme === "dark"

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-sm font-bold tracking-wider text-foreground">
            SOVEREIGN DOCUMENT SCANNER
          </h2>
        </div>
        <span className="hidden rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground md:inline-flex">
          CONTROL PLANE v3.2
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 md:flex">
          <Lock className="h-3 w-3 text-accent" />
          <span className="font-mono text-[10px] tracking-wider text-accent">
            TLS 1.3
          </span>
        </div>
        <div className="flex items-center gap-2 rounded border border-border bg-secondary px-3 py-1">
          <span className="font-mono text-xs tabular-nums text-foreground">
            {time}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            UTC
          </span>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
              "relative flex h-8 w-[52px] items-center rounded-full border p-0.5 transition-colors",
              isDark
                ? "border-border bg-secondary"
                : "border-border bg-secondary"
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Sun
              className={cn(
                "absolute left-1.5 h-3.5 w-3.5 transition-opacity",
                isDark ? "opacity-30 text-muted-foreground" : "opacity-100 text-amber-500"
              )}
            />
            <Moon
              className={cn(
                "absolute right-1.5 h-3.5 w-3.5 transition-opacity",
                isDark ? "opacity-100 text-primary" : "opacity-30 text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "h-5 w-5 rounded-full shadow-sm transition-all duration-300",
                isDark
                  ? "translate-x-[26px] bg-primary"
                  : "translate-x-0 bg-foreground"
              )}
            />
          </button>
        )}

        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        </button>
      </div>
    </header>
  )
}
