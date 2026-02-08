"use client"

import { useState } from "react"
import { Sidebar, type DashboardTab } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { MetricsBar } from "@/components/dashboard/metrics-bar"
import { ScannerPanel } from "@/components/dashboard/scanner-panel"
import { LogsTable } from "@/components/dashboard/logs-table"
import { LiveTrafficPanel } from "@/components/dashboard/live-traffic-panel"
import { PolicyConfigPanel } from "@/components/dashboard/policy-config-panel"

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<DashboardTab>("scanner")
  const [redactedCount, setRedactedCount] = useState(142)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={currentView} setActiveTab={setCurrentView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:p-6">
          <MetricsBar totalRedacted={redactedCount} />
          {currentView === "scanner" && (
            <ScannerPanel setRedactedCount={setRedactedCount} />
          )}
          {currentView === "logs" && <LogsTable />}
          {currentView === "traffic" && <LiveTrafficPanel />}
          {currentView === "policy" && <PolicyConfigPanel />}
        </main>
      </div>
    </div>
  )
}
