import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Configure with your API Key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Supported model: gemini-2.5-flash-lite supports PDF, images, video, audio
# (gemini-1.5-flash was deprecated and returns 404)
GEMINI_MODEL = "gemini-2.5-flash-lite"

# Mime types supported by Gemini for document/image input
VALID_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]


def _normalize_mime_type(mime_type: str | None) -> str:
    """Normalize mime type for Gemini. Handles None, empty, and PDF variants."""
    if not mime_type or not mime_type.strip():
        return "application/pdf"
    mt = mime_type.strip().lower()
    # Normalize common PDF variants
    if mt in ("application/pdf", "application/x-pdf"):
        return "application/pdf"
    if mt in VALID_MIME_TYPES:
        return mt
    # image/jpg is often sent; Gemini expects image/jpeg
    if mt == "image/jpg":
        return "image/jpeg"
    return "application/pdf"


def scan_document(file_bytes, mime_type="application/pdf"):
    """
    Uses Gemini 2.5 Flash-Lite to extract text from a scanned PDF/Image.
    Supports PDF and common image formats.
    """
    mime_type = _normalize_mime_type(mime_type)
    if mime_type not in VALID_MIME_TYPES and mime_type != "application/pdf":
        print(f"Warning: Unsupported mime type {mime_type}, defaulting to application/pdf")
        mime_type = "application/pdf"

    model = genai.GenerativeModel(GEMINI_MODEL)
    
    # The prompt tells Gemini to act as an OCR engine
    prompt = """
    You are a high-precision OCR engine for scanned documents used in regulated environments (healthcare, legal, government).

    TASK: Extract every word and character verbatim. Do not summarize, paraphrase, or interpret.

    RULES:
    - Preserve layout: headings, paragraphs, lists, tables, indentations.
    - Handle rotation: read text at any orientation and present it correctly.
    - Ignore artifacts: coffee stains, creases, marks, shadows—extract only actual text.
    - Preserve formatting: line breaks, spacing, bullet points, numbered lists.
    - Accuracy is critical: medical terms, legal phrasing, dates, and numbers must be exact.

    OUTPUT: Raw extracted text only. No commentary, no explanations, no "I extracted..."."""
    
    try:
        response = model.generate_content([
            {'mime_type': mime_type, 'data': file_bytes},
            prompt
        ])
        return response.text
    except Exception as e:
        print(f"Gemini OCR Error: {e}")
        return None