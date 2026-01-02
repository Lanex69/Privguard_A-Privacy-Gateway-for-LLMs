from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.detector import analyze_text
from app.redactor import redact_text
from app.content_safety import check_content_risk

app = FastAPI(title="PrivGuard Core Gateway", version="0.2.0")

# Since, visiting "/" Returns 404 error
@app.get("/")
def index():
    return {"service": "PrivGuard Core Gateway", "status": "running"}


# Analyze Endpoint
class AnalyzeRequest(BaseModel):
    text: str

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    entities = analyze_text(req.text)
    return {"entities": entities}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Redact Endpoint
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

# Proxy Endpoint
class ProxyRequest(BaseModel):
    text: str
    user_role: str = "Student"

@app.post("/proxy")
def proxy(req: ProxyRequest):
    try:
        # 1.AZURE SAFETY CHECK (The Guardrail).We check this *first* or *parallel* to PII. 
        # Severity 4 or 6 means "Hate/Violence" -> BLOCK immediately.
        azure_severity = check_content_risk(req.text)

        if azure_severity >= 4:
            return {
                "status": "blocked",
                "action": "BLOCKED_SAFETY_VIOLATION",
                "risk_score": azure_severity,
                "message": "Content blocked by Azure AI Safety Policy (High Severity)."
            }
        # 2. LOCAL PII DETECTION (The Privacy Layer)
        entities = analyze_text(req.text)
        
        # 3. ROUTING LOGIC (The "Brain")
        # Logic: If 'internal' is mentioned, route LOCALLY. Else, use CLOUD.
        if "internal" in req.text.lower():
            route = "LOCAL_MODEL_PHI3"
            mock_response = "[LOCAL] Processed on-premise. No data left the network."
        else:
            route = "CLOUD_OPENAI"
            mock_response = "[CLOUD] Safe request processed via Azure OpenAI."

        # 4. REDACTION (Sanitization)
        sanitized_text = redact_text(req.text, entities)

        # 5. GATEWAY RESPONSE
        return {
            "status": "success",
            "action": f"ROUTED_TO_{route}",
            "risk_score": azure_severity,
            "entities_detected": entities,
            "sanitized_prompt": sanitized_text,
            "llm_response": mock_response
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))