"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type AuditLogEntry = {
  event_id: string
  timestamp_utc: string
  user_role: string
  policy_action: string
  routing_decision: string
  detected_risk_level: string
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(",", "")
  } catch {
    return iso
  }
}

function getRiskColor(level: string) {
  const L = level.toUpperCase()
  if (L === "CRITICAL") return "text-destructive"
  if (L === "HIGH") return "text-[hsl(var(--warning))]"
  if (L === "MEDIUM") return "text-[hsl(var(--warning))]"
  return "text-accent"
}

function getRiskBg(level: string) {
  const L = level.toUpperCase()
  if (L === "CRITICAL") return "bg-destructive/10"
  if (L === "HIGH") return "bg-[hsl(var(--warning))]/10"
  if (L === "MEDIUM") return "bg-[hsl(var(--warning))]/10"
  return "bg-accent/10"
}

function getDestination(routing_decision: string): string {
  const r = (routing_decision || "").toUpperCase()
  if (r === "SAFE_MODE" || r === "LOCAL") return "Local"
  if (r === "CLOUD_LLM") return "Cloud"
  return "—"
}

export function LogsTable() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:8000/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs ?? [])
        setError(null)
      })
      .catch((err) => {
        setError(err.message || "Failed to load logs")
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          Loading audit logs...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="font-mono text-sm text-destructive">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Audit Logs
        </h3>
        <span className="font-mono text-[9px] tracking-wider text-muted-foreground/60">
          {logs.length} ENTRIES
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Timestamp (UTC)
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status / Action
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destination
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Risk Score
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={log.event_id}
                className={cn(
                  "border-b border-border/50 transition-colors hover:bg-secondary/50",
                  i === logs.length - 1 && "border-b-0"
                )}
              >
                <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatTimestamp(log.timestamp_utc)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground capitalize">
                  {log.user_role}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                  {log.policy_action}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider",
                      getDestination(log.routing_decision) === "Local"
                        ? "bg-accent/10 text-accent"
                        : getDestination(log.routing_decision) === "Cloud"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getDestination(log.routing_decision)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-bold",
                      getRiskColor(log.detected_risk_level),
                      getRiskBg(log.detected_risk_level)
                    )}
                  >
                    {log.detected_risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
