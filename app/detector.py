from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

# Configure NLP engine (spaCy)
provider = NlpEngineProvider(nlp_configuration={
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_md"}]
})

nlp_engine = provider.create_engine()

analyzer = AnalyzerEngine(
    nlp_engine = nlp_engine,
    supported_languages=["en"]
)

def analyze_text(text: str):
    results = analyzer.analyze(
        text=text,
        language="en"
    )

    return [
        {
            "entity_type": r.entity_type,
            "start": r.start,
            "end": r.end,
            "score": r.score
        }
        for r in results
    ]
