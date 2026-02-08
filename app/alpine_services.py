import requests
import time
import os
from dotenv import load_dotenv  # pip install python-dotenv
from typing import Dict, List, Literal, Optional

load_dotenv()

class PrivGuardGateway:
    
    '''
    - PrivGuard Gateway: A Policy enforcement layer for LLMs
    - Integrates with Alpine Privacy API for PII detection
    '''
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.documentprivacy.com"):
        
        self.api_key = api_key or os.getenv("ALPINE_API_KEY", "DEMO_MODE")
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json"
        })

        # Print status for your own sanity during the demo
        mode_msg = "DEMO_MODE (Simulated)" if self.api_key == "DEMO_MODE" else "LIVE MODE (Real API)"
        print(f"[Gateway] Initialized in {mode_msg}")

    def detect_pii(self, text: str, constitution: str = "HEALTH") -> Dict:
        
        '''
        It calls the DocumentPrivacy /extract endpoint
        '''

        # [SAFETY BACKUP] DEMO MODE

        if self.api_key == "DEMO_MODE":
            print("   [Gateway] Simulating upstream API latency (1.0s)...")
            time.sleep(1.0) 
            return {
                "private_phrases": ["John Doe", "01/15/1980"],
                "request_id": "demo_req_12345"
            }
        
        endpoint = f"{self.base_url}/extract"
        payload = {
            "document": text,
            "type": constitution # Example: HEALTH/LEGAL/FINANCE
        }

        try:
            # Added a short timeout
            response = self.session.post(endpoint, json=payload, timeout=8)
            
            # Handle Rate Limits (429)
            if response.status_code == 429:
                print("[!] Rate Limit Hit.")
                return {"error": "RATE_LIMIT", "private_phrases": []}

            # If key is invalid (401)
            if response.status_code == 401:
                print("[!] Error: Invalid API Key.")
                return {"error": "AUTH_ERROR", "private_phrases": []}
                
            response.raise_for_status()
            return response.json() # Returns {'private_phrases': [...], 'request_id': ...}

        except requests.exceptions.RequestException as e:
            print(f"[PrivGuard Error] Upstream API failed: {e}")
            return {"error": str(e), "private_phrases": []}

    def redact_text(self, text: str, phrases: List[str]) -> str:
        
        '''
        Deterministic redaction of detected phrases
        '''
        
        redacted_text = text
        for phrase in phrases:
            # Replace the PII with a placeholder
            redacted_text = redacted_text.replace(phrase, "<REDACTED_PII>")
        return redacted_text

    def route_request(self, prompt: str, policy: Literal["STRICT_BLOCK", "REDACT_CLOUD", "ROUTE_LOCAL"] = "REDACT_CLOUD") -> Dict:
        
        '''
        Core PrivGuard Logic:
        1. Scan prompt via DocumentPrivacy API
        2. Apply Policy (Block, Redact, or Route)
        '''
        
        print(f"--- Processing Request (Policy: {policy}) ---")
        
        # 1. Detect
        scan_result = self.detect_pii(prompt)
        
        # Fail Open Logic: If scanner breaks, we default to ALLOW (or BLOCK depending on risk)
        if "error" in scan_result:
            return {"action": "FAIL_OPEN", "reason": f"Scanner error{scan_result['error']}", "payload": prompt}

        pii_found = scan_result.get("private_phrases", [])
        has_pii = len(pii_found) > 0

        # 2. Policy Enforcement
        if not has_pii:
            return {
                "action": "ALLOW_CLOUD", 
                "target": "gpt-4o", 
                "payload": prompt
            }

        print(f"[!] Alert: PII Detected -> {pii_found}")

        if policy == "STRICT_BLOCK":
            return {
                "action": "BLOCK", 
                "target": None, 
                "payload": "[BLOCKED BY POLICY]"
            }
        
        elif policy == "REDACT_CLOUD":
            sanitized_prompt = self.redact_text(prompt, pii_found)
            return {
                "action": "ALLOW_CLOUD", 
                "target": "gpt-4o", 
                "payload": sanitized_prompt, 
                "meta": "Sanitized via PrivGuard"
            }
        
        elif policy == "ROUTE_LOCAL":
            return {
                "action": "ROUTE_PREM", 
                "target": "local-llama-3.3-70b", 
                "payload": prompt,
                "meta": "Data Sovereignty Enforced"
            }

# --- Quick Test ---
'''if __name__ == "__main__":

    gateway = PrivGuardGateway()

    # Test Case: Medical Records
    sensitive_prompt = "Patient John Doe (DOB 01/15/1980) shows signs of hypertension."
    
    # Simulate the scan result logic as if we had a live key
    # (In real usage, this calls the API)
    
    result = gateway.route_request(sensitive_prompt, policy="REDACT_CLOUD")
    
    print(f"\nDecision: {result['action']}")
    print(f"Final Payload: {result['payload']}")'''

# --- Interactive CLI Demo ---
if __name__ == "__main__":
    gateway = PrivGuardGateway()
    
    print(f"\n╔═══════════════════════════════════════════════╗")
    print(f"║   PrivGuard x Alpine Integration Demo v1.0    ║")
    print(f"╚═══════════════════════════════════════════════╝")
    print(f"Status: Using {gateway.api_key[:4]}... key")

    # Tuple Format: (Prompt, Policy)
    test_cases = [
        # Case 1: Standard PII -> Redact it
        ("Patient John Doe (DOB 01/15/1980) shows signs of hypertension.", "REDACT_CLOUD"),
        
        # Case 2: High Risk Secret -> Block it entirely
        ("My secret API Key is sk-1234-5678-9000", "STRICT_BLOCK"),
        
        # Case 3: Internal Data -> Route to On-Premise Model
        ("Internal Memo: Project 'DeepBlue' launch date is Q3.", "ROUTE_LOCAL"),
        
        # Case 4: Clean Data -> Allow
        ("The weather in Hyderabad is nice today.", "REDACT_CLOUD")
    ]

    print("\n--- Running Multi-Policy Auto-Tests ---")
    for prompt, policy_mode in test_cases:
        print(f"\n[Input]: {prompt}")
        result = gateway.route_request(prompt, policy=policy_mode)
        
        # Format the output to look like a decision log
        print(f" -> Policy:   {policy_mode}")
        print(f" -> Decision: {result['action']}")
        if result['payload']:
            print(f" -> Payload:  {result['payload']}")
        
        time.sleep(0.8) # Pause for dramatic effect

    # Manual Loop (Defaults to Redact for visual feedback)
    print("\n--- Manual Mode (Default: REDACT_CLOUD) ---")
    while True:
        try:
            user_input = input("\nEnter Prompt > ")
            if user_input.lower() in ["exit", "quit"]:
                break
            
            # We keep manual mode on REDACT because seeing the 
            # <REDACTED_PII> tag is the most satisfying visual proof.
            result = gateway.route_request(user_input, policy="REDACT_CLOUD")
            
            print(f"Decision: {result['action']}")
            print(f"Payload:  {result['payload']}")
        except KeyboardInterrupt:
            break