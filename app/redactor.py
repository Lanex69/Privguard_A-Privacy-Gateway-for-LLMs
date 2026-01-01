from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer import RecognizerResult
from presidio_anonymizer.entities import OperatorConfig  # <--- IMPORT THIS

anonymizer = AnonymizerEngine()

REDACTION_MAP = {
    "PERSON": "[REDACTED:PERSON]",
    "EMAIL_ADDRESS": "[REDACTED:EMAIL]",
    "PHONE_NUMBER": "[REDACTED:PHONE]",
    "LOCATION": "[REDACTED:LOCATION]",
    "ID_NUMBER": "[REDACTED:ID]",
    "URL": "[REDACTED:URL]"
}

def redact_text(text: str, entities: list):
    # 1. Convert our dict-based entities -> RecognizerResult objects
    # (Presidio requires these specific objects, not just dicts)
    recognizer_results = [
        RecognizerResult(
            entity_type = e["entity_type"],
            start = e["start"],
            end = e["end"],
            score = e["score"]
        )
        for e in entities
    ]

    # 2. Define the Operators using OperatorConfig
    # We map "PERSON" -> OperatorConfig("replace", {"new_value": "[REDACTED:PERSON]"})
    operators = {}
    for e in recognizer_results:
        if e.entity_type not in operators:
            operators[e.entity_type] = OperatorConfig(
                operator_name = "replace",
                params = {"new_value": REDACTION_MAP.get(e.entity_type, "[REDACTED]")}
            )

    # 3. Anonymize
    result = anonymizer.anonymize(
        text = text,
        analyzer_results = recognizer_results,
        operators = operators
    )

    return result.text

'''
We will Consider exposing why fields were redacted (later)
Later, we may log:
- entity count
- risk class
- decision source
We will keep that idea in mind.
'''