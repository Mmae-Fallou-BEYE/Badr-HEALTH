from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from biomistral import Analyzer, OllamaClient

pytestmark = pytest.mark.integration

FIXTURES = Path(__file__).resolve().parent / "fixtures"


@pytest.mark.skipif(
    os.getenv("BIOMISTRAL_RUN_INTEGRATION") != "1",
    reason="set BIOMISTRAL_RUN_INTEGRATION=1 to run the live Ollama test",
)
def test_live_biomistral_analysis() -> None:
    payload = json.loads(
        (FIXTURES / "astronaut_febrile.json").read_text(encoding="utf-8")
    )
    analyzer = Analyzer(client=OllamaClient(timeout_s=180))
    try:
        result = analyzer.analyze(payload)
    finally:
        analyzer.close()

    envelope = result.to_dict()
    assert envelope["model"]["name"]
    assert envelope["model"]["digest"]
    assert envelope["report"]["risk_level"] in {"Low", "Moderate", "High"}
    assert envelope["validation"]["attempts"] >= 1
    assert "disclaimer" in envelope

    for item in envelope["report"]["detected_abnormalities"]:
        assert item["evidence"]["field"]
        assert item["evidence"]["value"]
        assert item["parameter"]
        assert item["observed"]

    report_text = json.dumps(envelope["report"]).lower()
    assert "history of" not in report_text
    assert "sleep apnea" not in report_text
