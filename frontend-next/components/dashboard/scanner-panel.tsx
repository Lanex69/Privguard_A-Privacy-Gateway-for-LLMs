"use client"

import React from "react"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  FileText,
  ArrowDown,
  Cloud,
  Server,
  X,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const UPLOAD_SCAN_URL = "http://localhost:8000/upload_scan"

function mapPrivacyActionToRoute(privacyAction: string): "cloud" | "local" {
  const action = String(privacyAction || "").toUpperCase()
  if (action.includes("CLOUD") || action === "ALLOW_CLOUD") return "cloud"
  if (action.includes("LOCAL") || action.includes("PREM") || action === "ROUTE_PREM") return "local"
  return "local"
}

interface ScannerPanelProps {
  setRedactedCount: React.Dispatch<React.SetStateAction<number>>
}

export function ScannerPanel({ setRedactedCount }: ScannerPanelProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)
  const [routeDestination, setRouteDestination] = useState<"cloud" | "local">(
    "local"
  )
  const [originalSnippet, setOriginalSnippet] = useState<string>("")
  const [safeOutput, setSafeOutput] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcess = useCallback(async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedFile(e.target?.result as string)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)

    setIsProcessing(true)
    setIsProcessed(false)
    setOriginalSnippet("")
    setSafeOutput("")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("policy_mode", "REDACT_CLOUD")

    try {
      const res = await fetch(UPLOAD_SCAN_URL, {
        method: "POST",
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || data.error || `Request failed (${res.status})`)
      }
      if (data.error) {
        throw new Error(data.error)
      }

      setOriginalSnippet(data.original_snippet ?? "")
      setSafeOutput(data.safe_output ?? "")
      setRouteDestination(mapPrivacyActionToRoute(data.privacy_action ?? ""))
      setIsProcessed(true)
      setRedactedCount((prev) => prev + 5)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Backend request failed"
      toast.error("Scan failed", {
        description: msg.includes("fetch") || msg.includes("Failed to fetch")
          ? "Backend may not be running. Start the Python server and try again."
          : msg,
      })
      setUploadedFile(null)
      setFileName("")
      setOriginalSnippet("")
      setSafeOutput("")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleProcess(file)
    },
    [handleProcess]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleProcess(file)
    },
    [handleProcess]
  )

  const handleClear = () => {
    setUploadedFile(null)
    setFileName("")
    setIsProcessing(false)
    setIsProcessed(false)
    setOriginalSnippet("")
    setSafeOutput("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Top Section: Untrusted Input - Full width, shorter height */}
      <div className="flex w-full flex-col rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Untrusted Input (External)
            </h3>
          </div>
          {uploadedFile && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3 w-3" />
              CLEAR
            </button>
          )}
        </div>

        {!uploadedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click()
            }}
            role="button"
            tabIndex={0}
            className={cn(
              "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed transition-all",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/20 hover:border-primary/40 hover:bg-primary/5"
            )}
            aria-label="Upload document area. Click or drag and drop a PDF or image."
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/50">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm text-foreground">
                Drop PDF or Image
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/20">
            {isProcessing && (
              <div className="absolute inset-0 z-10 overflow-hidden">
                <div className="animate-scan-line h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
              </div>
            )}
            {uploadedFile.startsWith("data:image") ? (
              <img
                src={uploadedFile || "/placeholder.svg"}
                alt={`Uploaded document: ${fileName}`}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-6">
                <FileText className="h-12 w-12 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">
                  {fileName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Section: Routing/Policy - Centered between Input and Output */}
      <div className="flex flex-shrink-0 flex-col items-center justify-center py-2">
        <div className="flex flex-col items-center gap-3">
          {isProcessing ? (
            <>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Policy Enforcement
              </span>
              <div className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="animate-pulse-glow font-mono text-[11px] font-bold tracking-widest text-primary">
                  Scanning with Gemini...
                </span>
              </div>
              <ArrowDown className="h-4 w-4 text-primary" />
            </>
          ) : isProcessed ? (
            <>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Policy Enforcement
              </span>
              <ArrowDown className="h-4 w-4 text-primary" />
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border px-4 py-2.5",
                  routeDestination === "cloud"
                    ? "border-primary/30 bg-primary/10"
                    : "border-accent/30 bg-accent/10"
                )}
              >
                <div className="flex items-center gap-2">
                  {routeDestination === "cloud" ? (
                    <Cloud className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Server className="h-3.5 w-3.5 text-accent" />
                  )}
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold tracking-wider",
                      routeDestination === "cloud"
                        ? "text-primary"
                        : "text-accent"
                    )}
                  >
                    {routeDestination === "cloud"
                      ? "CLOUD (Azure OpenAI)"
                      : "LOCAL (On-Prem LLM)"}
                  </span>
                </div>
              </div>
              <p className="max-w-[200px] text-center font-mono text-[8px] leading-relaxed text-muted-foreground">
                Routing decision enforced by PrivGuard Policy Engine
              </p>
              <ArrowDown className="h-4 w-4 text-primary" />
            </>
          ) : (
            <>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Policy Enforcement
              </span>
              <span className="font-mono text-[10px] tracking-wider text-muted-foreground/60">
                AWAITING INPUT
              </span>
              <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
            </>
          )}
        </div>
      </div>

      {/* Bottom Section: Trusted Output - Full width, tall document editor */}
      <div className="flex min-h-[500px] flex-1 flex-col rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2
            className={cn(
              "h-3.5 w-3.5",
              isProcessed ? "text-accent" : "text-muted-foreground/40"
            )}
          />
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted Output (Policy-Compliant)
          </h3>
        </div>
        <div className="flex min-h-[500px] flex-1 flex-col gap-3 overflow-auto">
          {isProcessed && originalSnippet ? (
            <div className="rounded-md border border-border bg-[hsl(var(--terminal))] p-4">
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Preview
              </p>
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                {originalSnippet}
              </pre>
            </div>
          ) : null}
          <div className="min-h-[400px] flex-1 overflow-auto rounded-md border border-border bg-[hsl(var(--terminal))] p-4">
          {isProcessed ? (
            <textarea
              readOnly
              value={safeOutput}
              className="h-full min-h-[400px] w-full resize-none border-0 bg-transparent font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-0"
              spellCheck={false}
              aria-label="Sanitized output"
            />
          ) : isProcessing ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-mono text-xs text-muted-foreground">
                Scanning with Gemini...
              </span>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="font-mono text-[10px] text-muted-foreground/60">
                Upload a document to view policy-compliant output
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
