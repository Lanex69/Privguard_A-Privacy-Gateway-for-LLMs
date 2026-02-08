import hashlib
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional


from app.detector import analyze_text
from app.redactor import redact_text
from app.content_safety import check_content_risk
from app.gemini_ocr import scan_document
from app.alpine_services import PrivGuardGateway
from app.policy import PolicyEngine
from Security import log_event

load_dotenv()

app = FastAPI(title="PrivGuard Core Gateway", version="0.2.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
policy = PolicyEngine()

alpine_api_key = os.getenv("ALPINE_API_KEY")
alpine_gateway = PrivGuardGateway(api_key=alpine_api_key)

# Since, visiting "/" Returns 404 error
@app.get("/")
def index():
    return {
        "service": "PrivGuard Core Gateway", 
        "version": "v2 (Sovereign)", 
        "modules": ["Azure Content Safety", "Gemini OCR", "Alpine Privacy"]
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "alpine_connected": bool(alpine_api_key)}

# --- SOC DASHBOARD: Audit Log ---

AUDIT_LOG_PATH = Path(__file__).resolve().parent.parent / "Security" / "audit_log.jsonl"


def _read_audit_logs(limit: int = 50) -> list[dict]:
    """Read and parse audit log JSONL. Returns last `limit` entries, newest first."""
    if not AUDIT_LOG_PATH.exists():
        return []
    entries = []
    with open(AUDIT_LOG_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    entries.reverse()
    return entries[:limit]


@app.get("/logs")
def get_logs():
    """Return last 50 audit log entries, newest first."""
    return {"logs": _read_audit_logs(50)}


@app.get("/stats")
def get_stats():
    """Calculate SOC metrics from audit logs."""
    entries = _read_audit_logs(limit=10_000)
    total = len(entries)
    blocked = sum(1 for e in entries if e.get("policy_action") == "BLOCK")
    sovereign = sum(
        1
        for e in entries
        if e.get("routing_decision") in ("SAFE_MODE", "LOCAL")
    )
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for e in entries:
        r = (e.get("detected_risk_level") or "").upper()
        if r in risk_dist:
            risk_dist[r] += 1
    return {
        "total_requests": total,
        "blocked_count": blocked,
        "sovereign_count": sovereign,
        "risk_distribution": risk_dist,
    }


# --- NEW V2 ENDPOINT: DOCUMENT SCANNER ---
# This is the "Killer Feature" for TII/Government usage

@app.post("/upload_scan")
async def upload_scan(
    file: UploadFile = File(...), 
    policy_mode: str = Form("REDACT_CLOUD")
):
    """
    PrivGuard v2: The Sovereign Document Scanner (Sovereign Mode)
    1. Receives a raw PDF/Image (Messy, scanned).
    2. Uses Gemini 1.5 Flash to 'see' the text (OCR).
    3. Uses Alpine Privacy API to detect & redact PII contextually.
    4. Returns safe, clean text.
    """
    try:
        # 1. Read bytes
        content_bytes = await file.read()
        
        # 2. Get the Mime Type (gemini_ocr normalizes None/empty/PDF variants)
        content_type = file.content_type or "application/pdf"

        # 3. Pass BOTH to Gemini
        raw_text = scan_document(content_bytes, mime_type=content_type)
        
        if not raw_text:
            return {"error": "OCR Failed. Could not extract text from document."}
            
        # 4. Privacy Scan
        result = alpine_gateway.route_request(raw_text, policy=policy_mode)
        
        return {
            "status": "success",
            "original_snippet": raw_text[:200] + "...",
            "privacy_action": result["action"],
            "safe_output": result.get("payload", ""),
            "pii_meta": result.get("meta", "None"),
            "decision_source": "PrivGuard Policy Engine"
        }

    except Exception as e:
        print(f"Upload Scan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- EXISTING V1 ENDPOINTS (Still supported for legacy use) ---

# Analyze Endpoint
class AnalyzeRequest(BaseModel):
    text: str

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    entities = analyze_text(req.text)
    return {"entities": entities}

class RedactRequest(BaseModel):
    text: str

@app.post("/redact")
def redact(req: RedactRequest):
    entities = analyze_text(req.text)
    redacted = redact_text(req.text, entities)
    return {
        "original_text": req.text,
        "entities": entities,
        "redacted_text": redacted
    }

class ProxyRequest(BaseModel):
    text: str
    user_role: str = "Student"

@app.post("/proxy")
def proxy(req: ProxyRequest, x_user_role: str = Header(default="student")):
    try:
        effective_role = (x_user_role or req.user_role or "student").lower()
        
        # 1) AZURE SAFETY CHECK
        azure_severity = check_content_risk(req.text)

        # 2) Detects PII / Secrets contextually
        detections = analyze_text(req.text)

        # 3) Uses Policy Engine to decide on the action to take (BLOCK / LOCAL / REDACT / ALLOW)
        decision = policy.evaluate(
            role=effective_role,
            detections=detections,
            azure_severity=azure_severity
        )

        # 4) Logs the event to the audit log (safe — never breaks API)
        try:
            request_hash = hashlib.sha256(req.text.encode()).hexdigest()
            matched_patterns = [
                d.get("entity_type", "UNKNOWN")
                for d in detections
            ]

            log_event(
                user_role=effective_role,
                detected_risk=decision["risk_level"],
                matched_patterns=matched_patterns,
                action_taken=decision["action"],
                routing_decision=decision.get("route", "UNKNOWN"),
                request_hash=request_hash,
                processing_latency_ms=None
            )
        except Exception as log_error:
            # Never interrupt gateway execution if logging fails
            print("⚠️ Audit log failed but request continued:", log_error)

        # 5) ENFORCEMENT
        
        # BLOCKED BY POLICY
        if decision["action"] == "BLOCK":
            return {
                "status": "blocked",
                "action": "BLOCKED_BY_POLICY",
                "risk_level": decision["risk_level"],
                "risk_score": decision["risk_score"],
                "message": decision.get("reason", "Request blocked due to security policy.")
            }

        # ROUTED TO LOCAL / SAFE MODE (Redaction only)
        if decision.get("route") == "SAFE_MODE" or decision["action"] == "LOCAL":
            sanitized = redact_text(req.text, detections)
            return {
                "status": "success",
                "action": "ROUTED_TO_LOCAL_MODEL",
                "risk_level": decision["risk_level"],
                "risk_score": decision["risk_score"],
                "sanitized_prompt": sanitized,
                "llm_response": "[LOCAL] Processed on-prem. No data left the network."
            }

        # ROUTED TO CLOUD LLM (default)
        sanitized = redact_text(req.text, detections)
        return {
            "status": "success",
            "action": "ROUTED_TO_CLOUD_OPENAI",
            "risk_level": decision["risk_level"],
            "risk_score": decision["risk_score"],
            "entities_detected": detections,
            "sanitized_prompt": sanitized,
            "llm_response": "[CLOUD] Safe request processed via Azure OpenAI."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
