from __future__ import annotations

import pytest
from pydantic import ValidationError

from biomistral.schemas import (
    AstronautData,
    BloodPressure,
    MedicalReport,
    REPORT_JSON_SCHEMA,
    RiskLevel,
)


def test_alias_and_blood_pressure_parsing(febrile_payload: dict) -> None:
    data = AstronautData.model_validate(febrile_payload)
    assert data.temperature_c == 38.1
    assert data.heart_rate_bpm == 108
    assert data.blood_pressure == BloodPressure(systolic=142, diastolic=92)
    assert data.spo2_pct == 96.0
    assert data.sleep_hours == 4.8
    assert data.radiation_daily_msv == 0.19
    assert data.radiation_cumulative_msv == 41.3


def test_canonical_dump_and_missing_fields(febrile_payload: dict) -> None:
    data = AstronautData.model_validate(febrile_payload)
    canonical = data.to_canonical_dict()
    assert canonical["temperature_c"] == 38.1
    assert canonical["heart_rate_bpm"] == 108
    assert canonical["blood_pressure"] == {"systolic": 142, "diastolic": 92}
    assert canonical["spo2_pct"] == 96.0
    assert data.missing_core_fields() == []

    partial = AstronautData.model_validate({"mission_day": 3})
    assert set(partial.missing_core_fields()) == {
        "temperature_c",
        "heart_rate_bpm",
        "blood_pressure",
        "spo2_pct",
        "sleep_hours",
    }


def test_symptoms_string_is_accepted() -> None:
    data = AstronautData.model_validate({"symptoms": "fatigue, headache"})
    assert data.symptoms == ["fatigue", "headache"]


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({"spo2": 120}, "spo2_pct"),
        ({"temperature": 50}, "temperature_c"),
        ({"heart_rate": 400}, "heart_rate_bpm"),
        ({"blood_pressure": "300/10"}, "blood_pressure"),
        ({"sleep_hours": 30}, "sleep_hours"),
    ],
)
def test_physical_ranges_are_enforced(payload: dict, field: str) -> None:
    with pytest.raises(ValidationError):
        AstronautData.model_validate(payload)


def test_report_contract(valid_report_payload: dict) -> None:
    report = MedicalReport.model_validate(valid_report_payload)
    assert report.risk_level == RiskLevel.MODERATE
    assert report.detected_abnormalities[0].parameter == "temperature_c"
    assert report.detected_abnormalities[0].evidence.field == "temperature_c"
    assert report.detected_abnormalities[0].evidence.value == "38.1"
    assert report.possible_risks[0].basis[0].field == "temperature_c"


def test_report_requires_evidence(valid_report_payload: dict) -> None:
    payload = dict(valid_report_payload)
    payload["detected_abnormalities"] = [
        {
            "parameter": "temperature_c",
            "observed": "38.1 C",
            "interpretation": "elevated",
            "evidence": {},
        }
    ]
    with pytest.raises(ValidationError):
        MedicalReport.model_validate(payload)


def test_json_schema_required_fields() -> None:
    assert set(REPORT_JSON_SCHEMA["required"]) == {
        "overall_assessment",
        "detected_abnormalities",
        "possible_risks",
        "recommendations",
        "risk_level",
        "contact_flight_surgeon",
    }
    assert REPORT_JSON_SCHEMA["additionalProperties"] is False
