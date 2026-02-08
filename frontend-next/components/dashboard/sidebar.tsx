"use client"

import { useState } from "react"
import {
  Activity,
  FileSearch,
  Settings,
  ScrollText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type DashboardTab = "scanner" | "logs" | "traffic" | "policy"

const navItems: { icon: typeof Activity; label: string; tab: DashboardTab }[] = [
  { icon: Activity, label: "Live Traffic", tab: "traffic" },
  { icon: FileSearch, label: "Document Scanner", tab: "scanner" },
  { icon: Settings, label: "Policy Config", tab: "policy" },
  { icon: ScrollText, label: "Audit Logs", tab: "logs" },
]

interface SidebarProps {
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar-background transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-mono text-sm font-bold tracking-wider text-foreground">
              PRIVGUARD
            </h1>
            <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
              CONTROL PLANE
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4" aria-label="Main navigation">
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => (
            <li key={item.tab}>
              <button
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === item.tab
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                aria-current={activeTab === item.tab ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="font-mono text-xs tracking-wide">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* System info */}
      <div className="border-t border-border px-4 py-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-mono text-[9px] tracking-wider text-muted-foreground/50">
              POLICY ENGINE v3.2.1
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {!collapsed && (
            <span className="font-mono text-[10px] tracking-wider text-accent">
              SYSTEM ONLINE
            </span>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
