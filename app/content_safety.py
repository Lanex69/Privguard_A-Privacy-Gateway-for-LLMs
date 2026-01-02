# app/content_safety.py
import os
import logging
from dotenv import load_dotenv
from azure.ai.contentsafety import ContentSafetyClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.ai.contentsafety.models import AnalyzeTextOptions

load_dotenv()

# Logger to catch errors without crashing the app
logger = logging.getLogger("privguard.azure")

def get_client():
    endpoint = os.getenv("AZURE_CONTENT_SAFETY_ENDPOINT")
    key = os.getenv("AZURE_CONTENT_SAFETY_KEY")
    
    if not endpoint or not key:
        logger.warning("Azure Content Safety credentials not found. Skipping cloud check.")
        return None

    return ContentSafetyClient(endpoint, AzureKeyCredential(key))

def check_content_risk(text: str) -> int:
    """
    Returns a severity score (0, 2, 4, 6).
    0 = Safe, 2 = Low, 4 = Medium, 6 = High.
    Returns 0 if Azure is unreachable (fail-open for MVP).
    """
    client = get_client()
    if not client:
        return 0

    try:
        request = AnalyzeTextOptions(text=text)
        result = client.analyze_text(request)
        
        # Get the highest severity found across all categories (Hate, SelfHarm, Sexual, Violence)
        severities = [c.severity for c in result.categories_analysis if c.severity is not None]
        return max(severities) if severities else 0
        
    except HttpResponseError as e:
        logger.error(f"Azure Content Safety Error: {e}")
        return 0
    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        return 0