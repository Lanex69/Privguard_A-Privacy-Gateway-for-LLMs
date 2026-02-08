"use client"

import { Settings } from "lucide-react"

export function PolicyConfigPanel() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
            Policy Config
          </h3>
        </div>
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Default Policy Mode
            </label>
            <select className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
              <option value="REDACT_CLOUD">Redact & Cloud</option>
              <option value="ROUTE_LOCAL">Route Local</option>
              <option value="STRICT_BLOCK">Strict Block</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sensitive Domains
            </label>
            <input
              type="text"
              placeholder="HEALTH, LEGAL, FINANCE"
              className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="strict-mode"
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="strict-mode" className="font-mono text-xs text-foreground">
              Enable strict PII blocking
            </label>
          </div>
          <button
            type="submit"
            className="w-fit rounded-md bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            SAVE CONFIG
          </button>
        </form>
      </div>
    </div>
  )
}
