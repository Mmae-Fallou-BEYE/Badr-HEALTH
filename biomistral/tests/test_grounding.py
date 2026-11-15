from __future__ import annotations

import copy
import json

from biomistral.grounding import check_grounding, sanitize_report
from biomistral.schemas import MedicalReport


def _report(payload: dict) -> MedicalReport:
    return MedicalReport.model_validate(payload)


def test_valid_report_has_no_violations(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    result = check_grounding(_report(valid_report_payload), febrile_payload)
    assert result.violations == []
    assert result.needs_review is False
    assert result.warnings == []


def test_hallucinated_history_is_flagged(
    hallucinated_report_payload: dict, febrile_payload: dict
) -> None:
    result = check_grounding(
        _report(hallucinated_report_payload), febrile_payload
    )
    assert any("history of" in item for item in result.violations)
    assert result.needs_review is True


def test_unknown_number_is_flagged(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["contact_flight_surgeon"]["reason"] = (
        "Heart rate 140 bpm requires immediate review."
    )
    result = check_grounding(_report(payload), febrile_payload)
    assert any("140" in item for item in result.violations)


def test_evidence_mismatch_is_flagged(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"][0]["evidence"] = {
        "field": "temperature_c",
        "value": "39.9",
    }
    result = check_grounding(_report(payload), febrile_payload)
    assert any("does not match" in item for item in result.violations)


def test_parameter_and_evidence_mismatch_is_flagged(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"][0]["parameter"] = "heart_rate_bpm"
    result = check_grounding(_report(payload), febrile_payload)
    assert any("does not match evidence field" in item for item in result.violations)


def test_high_risk_requires_flight_surgeon(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["risk_level"] = "High"
    payload["contact_flight_surgeon"]["decision"] = "No"
    result = check_grounding(_report(payload), febrile_payload)
    assert any("High risk requires" in item for item in result.violations)


def test_alias_evidence_is_accepted(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"][0]["parameter"] = "temperature"
    payload["detected_abnormalities"][0]["evidence"] = {
        "field": "temperature",
        "value": "38.1",
    }
    result = check_grounding(_report(payload), febrile_payload)
    assert result.violations == []


def test_risk_without_possibility_language_warns(
    hallucinated_report_payload: dict, febrile_payload: dict
) -> None:
    result = check_grounding(
        _report(hallucinated_report_payload), febrile_payload
    )
    assert any("possibility" in item for item in result.warnings)


def test_prescription_is_flagged_and_sanitized(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["recommendations"].append("Give 500 mg of aspirin")
    result = check_grounding(_report(payload), febrile_payload)
    assert any("prescriptions" in item for item in result.violations)
    assert result.needs_review is True

    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert "Give 500 mg of aspirin" not in sanitized.recommendations
    assert warnings


def test_sanitize_replaces_hallucinated_reason(
    hallucinated_report_payload: dict, febrile_payload: dict
) -> None:
    sanitized, warnings = sanitize_report(
        _report(hallucinated_report_payload), febrile_payload
    )
    assert "history of" not in sanitized.contact_flight_surgeon.reason.lower()
    assert warnings


def test_sanitize_drops_unsupported_abnormality(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["detected_abnormalities"][0]["evidence"] = {
        "field": "temperature_c",
        "value": "39.9",
    }
    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert len(sanitized.detected_abnormalities) == 3
    assert all(
        item.parameter != "temperature_c"
        for item in sanitized.detected_abnormalities
    )
    assert warnings


def test_sanitize_drops_risk_with_forbidden_claim(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["possible_risks"][0]["risk"] = (
        "possible illness related to history of sleep apnea"
    )
    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert all("history" not in item.risk.lower() for item in sanitized.possible_risks)
    assert warnings


def test_sanitize_escalates_high_risk(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["risk_level"] = "High"
    payload["contact_flight_surgeon"]["decision"] = "No"
    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert sanitized.contact_flight_surgeon.decision.value == "Yes"
    assert warnings


def test_unknown_number_in_assessment_is_replaced(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = (
        "The astronaut has a heart rate of 140 bpm and needs review."
    )
    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert "140" not in sanitized.overall_assessment
    assert warnings


def test_sanitized_report_is_json_serializable(
    hallucinated_report_payload: dict, febrile_payload: dict
) -> None:
    sanitized, _ = sanitize_report(
        _report(hallucinated_report_payload), febrile_payload
    )
    json.dumps(sanitized.model_dump(mode="json"))


def test_ungrounded_assessment_sentence_is_flagged(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = (
        "The astronaut has a temperature of 38.1 C. "
        "The astronaut is otherwise in good health."
    )
    result = check_grounding(_report(payload), febrile_payload)
    assert any(
        "each sentence must cite" in item for item in result.violations
    )


def test_decimal_values_do_not_inflate_sentence_count(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = (
        "The astronaut has a temperature of 38.1 C and a heart rate of "
        "108 bpm. Insufficient data are available to establish a cause."
    )
    result = check_grounding(_report(payload), febrile_payload)
    assert not any(
        "at most" in item and "sentences" in item for item in result.violations
    )


def test_reversed_blood_pressure_is_flagged(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = (
        "The astronaut has a blood pressure of 92/142 mmHg. "
        "These findings require review."
    )
    result = check_grounding(_report(payload), febrile_payload)
    assert any("reversed" in item for item in result.violations)


def test_sanitize_keeps_grounded_sentences(
    valid_report_payload: dict, febrile_payload: dict
) -> None:
    payload = copy.deepcopy(valid_report_payload)
    payload["overall_assessment"] = (
        "The astronaut has a temperature of 38.1 C. "
        "The astronaut is otherwise in good health."
    )
    sanitized, warnings = sanitize_report(_report(payload), febrile_payload)
    assert "38.1" in sanitized.overall_assessment
    assert "good health" not in sanitized.overall_assessment.lower()
    assert any("Removed unsupported" in item for item in warnings)
