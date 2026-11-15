from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

FIXTURES = Path(__file__).resolve().parent / "fixtures"


@pytest.fixture
def febrile_payload() -> dict:
    return json.loads((FIXTURES / "astronaut_febrile.json").read_text(encoding="utf-8"))


@pytest.fixture
def valid_report_payload() -> dict:
    return json.loads((FIXTURES / "valid_report.json").read_text(encoding="utf-8"))


@pytest.fixture
def hallucinated_report_payload() -> dict:
    return json.loads(
        (FIXTURES / "hallucinated_report.json").read_text(encoding="utf-8")
    )


@pytest.fixture
def valid_report_json(valid_report_payload: dict) -> str:
    return json.dumps(valid_report_payload)


@pytest.fixture
def hallucinated_report_json(hallucinated_report_payload: dict) -> str:
    return json.dumps(hallucinated_report_payload)
