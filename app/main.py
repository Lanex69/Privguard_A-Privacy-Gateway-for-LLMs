from fastapi import FastAPI
from pydantic import BaseModel
from app.detector import analyze_text
from app.redactor import redact_text

app = FastAPI(
    title="PrivGuard Core Gateway",
    version="0.1.0",
    description="Privacy-preserving AI request gateway"
)

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