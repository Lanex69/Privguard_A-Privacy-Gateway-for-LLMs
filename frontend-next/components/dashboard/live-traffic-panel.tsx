"use client"

import { useEffect, useState } from "react"
import { Activity, TrendingUp } from "lucide-react"

type Stats = {
  total_requests: number
  blocked_count: number
  sovereign_count: number
  risk_distribution: Record<string, number>
}

export function LiveTrafficPanel() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:8000/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || "Failed to load stats")
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8">
        <p className="font-mono text-sm text-muted-foreground">
          Loading SOC metrics...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8">
        <p className="font-mono text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const total = stats?.total_requests ?? 0
  const blocked = stats?.blocked_count ?? 0
  const sovereign = stats?.sovereign_count ?? 0
  const riskDist = stats?.risk_distribution ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  const sovereignPct = total > 0 ? Math.round((sovereign / total) * 100) : 0
  const cloudPct = total > 0 ? 100 - sovereignPct : 0

  const riskOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
  const riskTotal = riskOrder.reduce((s, k) => s + (riskDist[k] ?? 0), 0)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Live Traffic
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-border bg-secondary/20 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Requests
            </p>
            <p className="font-mono text-2xl font-bold text-foreground">
              {total}
            </p>
          </div>
          <div className="rounded-md border border-border bg-secondary/20 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Blocked
            </p>
            <p className="font-mono text-2xl font-bold text-destructive">
              {blocked}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-border bg-secondary/20 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Local vs Cloud
          </p>
          <div className="flex items-center gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${sovereignPct}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Local (Sovereign) {sovereignPct}%
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Cloud {cloudPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-border bg-secondary/20 p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Risk Distribution
          </p>
          <div className="flex flex-col gap-2">
            {riskOrder.map((level) => {
              const count = riskDist[level] ?? 0
              const pct = riskTotal > 0 ? (count / riskTotal) * 100 : 0
              const barColor =
                level === "CRITICAL"
                  ? "bg-destructive"
                  : level === "HIGH"
                    ? "bg-[hsl(var(--warning))]"
                    : level === "MEDIUM"
                      ? "bg-[hsl(var(--warning))]/70"
                      : "bg-accent"
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="w-16 font-mono text-[10px] text-muted-foreground">
                    {level}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-2 ${barColor} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {count} ({Math.round(pct)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="font-mono text-xs text-muted-foreground">
          Metrics from audit log. Refresh to update.
        </span>
      </div>
    </div>
  )
}
