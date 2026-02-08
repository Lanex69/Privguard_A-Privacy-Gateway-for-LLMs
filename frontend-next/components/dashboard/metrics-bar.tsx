"use client"

import { ShieldCheck, Globe, Activity } from "lucide-react"

interface MetricsBarProps {
  totalRedacted?: number
  sovereigntyPercent?: number
  utilityPercent?: number
}

const defaultMetrics = {
  totalRedacted: 142,
  sovereigntyPercent: 85,
  utilityPercent: 98,
}

export function MetricsBar({
  totalRedacted = defaultMetrics.totalRedacted,
  sovereigntyPercent = defaultMetrics.sovereigntyPercent,
  utilityPercent = defaultMetrics.utilityPercent,
}: MetricsBarProps) {
  const metrics = [
    {
      icon: ShieldCheck,
      label: "PII Redacted",
      value: `${totalRedacted} entities`,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: Globe,
      label: "Sovereignty Preserved",
      value: `${sovereigntyPercent}%`,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: Activity,
      label: "Utility Preserved (Token Similarity)",
      value: `${utilityPercent}%`,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/30",
      prominent: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`flex items-center gap-3 rounded-lg border ${metric.borderColor} ${metric.bgColor} px-4 py-3 ${
            metric.prominent ? "ring-1 ring-accent/20" : ""
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${metric.bgColor}`}
          >
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {metric.label}
            </p>
            <p
              className={`font-mono text-lg font-bold tracking-tight ${metric.color} ${
                metric.prominent ? "animate-pulse-glow" : ""
              }`}
            >
              {metric.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
