from __future__ import annotations

import copy
import json

import pytest

from biomistral.exceptions import ReportValidationError
from biomistral.validator import extract_json_object, validate_report


def test_extracts_json_from_code_fence(valid_report_payload: dict) -> None:
    raw = f"Here is the report:\n```json\n{json.dumps(valid_report_payload)}\n```"
    payload = extract_json_object(raw)
    assert payload["risk_level"] == "Moderate"


def test_valid_report_is_accepted(valid_report_json: str) -> None:
    result = validate_report(valid_report_json)
    assert result.report.risk_level.value == "Moderate"
    assert result.warnings == []


def test_enums_are_normalized(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["risk_level"] = "moderate"
    payload["contact_flight_surgeon"]["decision"] = "yes"
    payload["possible_risks"][0]["uncertainty"] = "medium"

    result = validate_report(json.dumps(payload))
    assert result.report.risk_level.value == "Moderate"
    assert result.report.contact_flight_surgeon.decision.value == "Yes"
    assert result.report.possible_risks[0].uncertainty.value == "Moderate"
    assert result.warnings


def test_rejects_plain_string_abnormalities(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"] = ["fever"]
    with pytest.raises(ReportValidationError):
        validate_report(json.dumps(payload))


def test_rejects_missing_required_field(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    del payload["risk_level"]
    with pytest.raises(ReportValidationError, match="Missing required field"):
        validate_report(json.dumps(payload))


def test_rejects_invalid_json() -> None:
    with pytest.raises(ReportValidationError):
        validate_report("this is not json")


def test_rejects_empty_reason(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["contact_flight_surgeon"]["reason"] = "   "
    with pytest.raises(ReportValidationError):
        validate_report(json.dumps(payload))


def test_rejects_risk_label_as_assessment(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = "Moderate"
    with pytest.raises(ReportValidationError):
        validate_report(json.dumps(payload))


def test_rejects_extra_top_level_field(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["chain_of_thought"] = "hidden reasoning"
    with pytest.raises(ReportValidationError):
        validate_report(json.dumps(payload))


def test_empty_abnormalities_are_allowed(valid_report_payload: dict) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"] = []
    payload["possible_risks"] = []
    result = validate_report(json.dumps(payload))
    assert result.report.detected_abnormalities == []
