from __future__ import annotations

import json
from typing import Any

import pytest

from biomistral import (
    Analyzer,
    ConfigurationError,
    FlagSeverity,
    InputValidationError,
    InvalidModelOutputError,
    ModelNotFoundError,
    analyze_astronaut_data,
)
from biomistral.prompts import SYSTEM_PROMPT, build_user_prompt
from biomistral.schemas import AstronautData


class FakeClient:
    model = "fake-biomistral"

    def __init__(self, responses: list[str | Exception]) -> None:
        self.responses = list(responses)
        self.calls: list[dict[str, Any]] = []

    def chat_structured(self, **kwargs: Any) -> str:
        self.calls.append(kwargs)
        if not self.responses:
            raise AssertionError("No fake response left")
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response

    def model_info(self) -> dict[str, Any]:
        return {"name": self.model, "digest": "fake-digest"}

    def healthcheck(self) -> dict[str, Any]:
        return {
            "ok": True,
            "model": self.model,
            "model_available": True,
            "model_info": self.model_info(),
        }


def test_valid_analysis(febrile_payload: dict, valid_report_json: str) -> None:
    client = FakeClient([valid_report_json])
    result = Analyzer(client=client).analyze(febrile_payload)

    assert result.attempts == 1
    assert result.needs_review is False
    assert result.warnings == []
    assert result.red_flags is not None
    assert result.red_flags.highest_severity == FlagSeverity.WARNING
    assert len(client.calls) == 1
    assert "previous_response" not in client.calls[0]
    assert client.calls[0]["feedback"] is None

    envelope = result.to_dict()
    assert envelope["report"]["risk_level"] == "Moderate"
    assert envelope["model"]["name"] == "fake-biomistral"
    assert envelope["model"]["digest"] == "fake-digest"
    assert envelope["input"]["missing_fields"] == []
    assert envelope["red_flags"]["highest_severity"] == "Warning"
    assert envelope["validation"] == {
        "attempts": 1,
        "warnings": [],
        "needs_review": False,
    }


def test_retry_after_invalid_json(
    febrile_payload: dict, valid_report_json: str
) -> None:
    client = FakeClient(["not json", valid_report_json])
    result = Analyzer(client=client).analyze(febrile_payload)

    assert result.attempts == 2
    assert len(client.calls) == 2
    assert "previous_response" not in client.calls[1]
    assert "No JSON object" in client.calls[1]["feedback"]


def test_retry_after_hallucination(
    febrile_payload: dict,
    hallucinated_report_json: str,
    valid_report_json: str,
) -> None:
    client = FakeClient([hallucinated_report_json, valid_report_json])
    result = Analyzer(client=client).analyze(febrile_payload)

    assert result.attempts == 2
    assert "history of" in client.calls[1]["feedback"]
    report_text = json.dumps(result.to_dict()["report"]).lower()
    assert "history of" not in report_text


def test_sanitizes_after_all_attempts(
    febrile_payload: dict, hallucinated_report_json: str
) -> None:
    client = FakeClient([hallucinated_report_json, hallucinated_report_json])
    result = Analyzer(client=client).analyze(febrile_payload)

    assert result.attempts == 2
    assert result.needs_review is True
    assert result.warnings
    reason = result.to_dict()["report"]["contact_flight_surgeon"]["reason"]
    assert "history of" not in reason.lower()


def test_structural_failure_after_all_attempts(febrile_payload: dict) -> None:
    client = FakeClient(["not json", "still not json"])
    with pytest.raises(InvalidModelOutputError) as exc_info:
        Analyzer(client=client).analyze(febrile_payload)

    assert exc_info.value.details["attempts"] == 2
    assert exc_info.value.details["errors"]


def test_invalid_input_is_rejected(febrile_payload: dict) -> None:
    client = FakeClient([])
    payload = dict(febrile_payload)
    payload["spo2"] = 150
    with pytest.raises(InputValidationError) as exc_info:
        Analyzer(client=client).analyze(payload)

    assert exc_info.value.details
    assert client.calls == []


def test_invalid_max_attempts(febrile_payload: dict) -> None:
    with pytest.raises(ConfigurationError):
        Analyzer(client=FakeClient([])).analyze(
            febrile_payload, max_attempts=0
        )


def test_model_errors_are_propagated(febrile_payload: dict) -> None:
    client = FakeClient([ModelNotFoundError("missing model")])
    with pytest.raises(ModelNotFoundError):
        Analyzer(client=client).analyze(febrile_payload)


def test_public_api_returns_envelope(
    febrile_payload: dict, valid_report_json: str
) -> None:
    envelope = analyze_astronaut_data(
        febrile_payload, client=FakeClient([valid_report_json])
    )
    assert set(envelope) == {
        "schema_version",
        "generated_at",
        "model",
        "input",
        "red_flags",
        "report",
        "validation",
        "disclaimer",
    }
    assert envelope["schema_version"] == "1.1"
    assert envelope["red_flags"]["highest_severity"] == "Warning"
    assert "flight surgeon" in envelope["disclaimer"].lower()


def test_prompt_does_not_request_hidden_reasoning() -> None:
    lowered = SYSTEM_PROMPT.lower()
    assert "chain-of-thought" in lowered
    assert "do not provide internal reasoning" in lowered
    assert "explain your reasoning" not in lowered


def test_prompt_contains_canonical_data_and_missing_fields() -> None:
    prompt = build_user_prompt(
        {"temperature_c": 38.1, "heart_rate_bpm": 108},
        ["blood_pressure"],
    )
    assert "temperature_c" in prompt
    assert "MISSING_FIELDS" in prompt
    assert "blood_pressure" in prompt


def test_red_flags_are_sent_to_model_without_thresholds(
    febrile_payload: dict, valid_report_json: str
) -> None:
    client = FakeClient([valid_report_json])
    Analyzer(client=client).analyze(febrile_payload)

    prompt = client.calls[0]["user_prompt"]
    assert "SCREENING_FLAGS" in prompt
    assert "TEMP_HIGH_WARNING" in prompt
    assert '"threshold"' not in prompt
    assert ">= 38.0" not in prompt


def test_critical_red_flag_escalates_without_changing_report(
    febrile_payload: dict, valid_report_payload: dict
) -> None:
    input_payload = dict(febrile_payload)
    input_payload["temperature"] = 39.2

    report_payload = json.loads(json.dumps(valid_report_payload))
    report_payload["overall_assessment"] = report_payload[
        "overall_assessment"
    ].replace("38.1", "39.2")
    report_payload["detected_abnormalities"][0]["observed"] = "39.2 C"
    report_payload["detected_abnormalities"][0]["evidence"]["value"] = "39.2"
    report_payload["possible_risks"][0]["basis"][0]["value"] = "39.2"
    report_payload["contact_flight_surgeon"]["reason"] = report_payload[
        "contact_flight_surgeon"
    ]["reason"].replace("38.1", "39.2")

    client = FakeClient([json.dumps(report_payload)])
    result = Analyzer(client=client).analyze(input_payload)

    assert result.needs_review is True
    assert result.red_flags is not None
    assert result.red_flags.highest_severity == FlagSeverity.CRITICAL
    assert result.report.risk_level.value == "Moderate"
    assert result.report.contact_flight_surgeon.decision.value == "Yes"
    assert any(
        "Critical deterministic red flag" in warning
        for warning in result.warnings
    )

    envelope = result.to_dict()
    assert envelope["red_flags"]["highest_severity"] == "Critical"
    assert envelope["report"]["risk_level"] == "Moderate"


def test_input_hash_is_stable(
    febrile_payload: dict, valid_report_json: str
) -> None:
    first = Analyzer(client=FakeClient([valid_report_json])).analyze(
        febrile_payload
    )
    second = Analyzer(client=FakeClient([valid_report_json])).analyze(
        febrile_payload
    )
    assert first.input_hash == second.input_hash
    assert len(first.input_hash) == 64


def test_astronaut_data_instance_is_accepted(
    febrile_payload: dict, valid_report_json: str
) -> None:
    data = AstronautData.model_validate(febrile_payload)
    result = Analyzer(client=FakeClient([valid_report_json])).analyze(data)
    assert result.attempts == 1
