# PrivGuard x DocumentPrivacy Integration Test

A proof-of-concept middleware that uses the **Alpine Privacy /extract API** as the detection engine for the **PrivGuard Gateway**.

### Concept
PrivGuard acts as a policy enforcement point before LLM inference. Instead of relying on brittle regex (Presidio), this prototype delegates detection to the Constitutional AI API.

### Logic Flow
1. **Intercept** user prompt.
2. **Scan** using `api.documentprivacy.com/extract` (Health/Finance/Legal constitution).
3. **Enforce** Policy:
   * `STRICT_BLOCK`: Drop request.
   * `REDACT_CLOUD`: Redact detected spans -> forward to OpenAI/Anthropic.
   * `ROUTE_LOCAL`: Forward raw prompt to on-prem Llama-3 (Data Sovereignty).

### Usage
```python
gateway = PrivGuardGateway(api_key="...")
result = gateway.route_request(user_prompt, policy="REDACT_CLOUD")
```