from __future__ import annotations

import pytest

from biomistral.red_flags import (
    FlagSeverity,
    RedFlagThresholds,
    evaluate_red_flags,
)
from biomistral.schemas import AstronautData

NORMAL_PAYLOAD = {
    "mission_day": 120,
    "temperature_c": 36.6,
    "heart_rate_bpm": 68,
    "blood_pressure": {"systolic": 118, "diastolic": 76},
    "spo2_pct": 98,
    "sleep_hours": 7.5,
}


def _data(**overrides: object) -> AstronautData:
    payload = dict(NORMAL_PAYLOAD)
    payload.update(overrides)
    return AstronautData.model_validate(payload)


def _codes(report) -> list[str]:
    return [flag.code for flag in report.flags]


def test_normal_data_has_no_flags() -> None:
    report = evaluate_red_flags(_data())

    assert report.flags == []
    assert report.highest_severity is None
    assert report.evaluated_fields == [
        "temperature_c",
        "heart_rate_bpm",
        "blood_pressure",
        "spo2_pct",
        "sleep_hours",
    ]
    assert report.rule_set_version == "1.0"
    assert "not a diagnosis" in report.note


def test_febrile_payload_produces_expected_warnings(
    febrile_payload: dict,
) -> None:
    report = evaluate_red_flags(AstronautData.model_validate(febrile_payload))

    assert _codes(report) == [
        "TEMP_HIGH_WARNING",
        "HR_HIGH_WARNING",
        "BP_HIGH_WARNING",
        "SLEEP_SHORT_WARNING",
    ]
    assert report.highest_severity == FlagSeverity.WARNING
    assert all(
        flag.severity == FlagSeverity.WARNING for flag in report.flags
    )


@pytest.mark.parametrize(
    ("temperature", "expected"),
    [
        (37.4, None),
        (37.5, "TEMP_ELEVATED_INFO"),
        (37.9, "TEMP_ELEVATED_INFO"),
        (38.0, "TEMP_HIGH_WARNING"),
        (38.9, "TEMP_HIGH_WARNING"),
        (39.0, "TEMP_HIGH_CRITICAL"),
        (36.0, None),
        (35.9, "TEMP_LOW_WARNING"),
        (35.0, "TEMP_LOW_WARNING"),
        (34.9, "TEMP_LOW_CRITICAL"),
    ],
)
def test_temperature_boundaries(
    temperature: float, expected: str | None
) -> None:
    report = evaluate_red_flags(_data(temperature_c=temperature))
    assert _codes(report) == ([expected] if expected else [])


@pytest.mark.parametrize(
    ("heart_rate", "expected"),
    [
        (50, None),
        (49, "HR_LOW_WARNING"),
        (40, "HR_LOW_WARNING"),
        (39, "HR_LOW_CRITICAL"),
        (100, None),
        (101, "HR_HIGH_WARNING"),
        (129, "HR_HIGH_WARNING"),
        (130, "HR_HIGH_CRITICAL"),
    ],
)
def test_heart_rate_boundaries(
    heart_rate: int, expected: str | None
) -> None:
    report = evaluate_red_flags(_data(heart_rate_bpm=heart_rate))
    assert _codes(report) == ([expected] if expected else [])


@pytest.mark.parametrize(
    ("systolic", "diastolic", "expected"),
    [
        (129, 79, None),
        (130, 80, "BP_BORDERLINE_INFO"),
        (139, 89, "BP_BORDERLINE_INFO"),
        (140, 90, "BP_HIGH_WARNING"),
        (179, 119, "BP_HIGH_WARNING"),
        (180, 120, "BP_HIGH_CRITICAL"),
        (90, 60, None),
        (89, 59, "BP_LOW_WARNING"),
        (80, 50, "BP_LOW_WARNING"),
        (79, 49, "BP_LOW_CRITICAL"),
    ],
)
def test_blood_pressure_boundaries(
    systolic: int, diastolic: int, expected: str | None
) -> None:
    report = evaluate_red_flags(
        _data(
            blood_pressure={
                "systolic": systolic,
                "diastolic": diastolic,
            }
        )
    )
    assert _codes(report) == ([expected] if expected else [])


@pytest.mark.parametrize(
    ("spo2", "expected"),
    [
        (95, None),
        (94, "SPO2_LOW_WARNING"),
        (90, "SPO2_LOW_WARNING"),
        (89, "SPO2_CRITICAL"),
    ],
)
def test_spo2_boundaries(spo2: float, expected: str | None) -> None:
    report = evaluate_red_flags(_data(spo2_pct=spo2))
    assert _codes(report) == ([expected] if expected else [])


@pytest.mark.parametrize(
    ("sleep_hours", "expected"),
    [
        (7.0, None),
        (6.9, "SLEEP_INSUFFICIENT_INFO"),
        (6.0, "SLEEP_INSUFFICIENT_INFO"),
        (5.9, "SLEEP_SHORT_WARNING"),
    ],
)
def test_sleep_boundaries(
    sleep_hours: float, expected: str | None
) -> None:
    report = evaluate_red_flags(_data(sleep_hours=sleep_hours))
    assert _codes(report) == ([expected] if expected else [])


def test_missing_fields_are_skipped() -> None:
    report = evaluate_red_flags(
        AstronautData.model_validate({"mission_day": 1})
    )

    assert report.flags == []
    assert report.evaluated_fields == []
    assert report.highest_severity is None


def test_input_is_not_mutated(febrile_payload: dict) -> None:
    data = AstronautData.model_validate(febrile_payload)
    before = data.model_dump()

    evaluate_red_flags(data)

    assert data.model_dump() == before


def test_flags_are_sorted_by_severity() -> None:
    report = evaluate_red_flags(
        _data(
            temperature_c=39.2,
            heart_rate_bpm=45,
            sleep_hours=6.5,
        )
    )

    assert _codes(report) == [
        "TEMP_HIGH_CRITICAL",
        "HR_LOW_WARNING",
        "SLEEP_INSUFFICIENT_INFO",
    ]
    assert [flag.severity for flag in report.flags] == [
        FlagSeverity.CRITICAL,
        FlagSeverity.WARNING,
        FlagSeverity.INFO,
    ]


def test_prompt_flags_exclude_threshold_values(
    febrile_payload: dict,
) -> None:
    report = evaluate_red_flags(
        AstronautData.model_validate(febrile_payload)
    )

    prompt_flags = report.to_prompt_flags()

    assert prompt_flags
    assert all("threshold" not in flag for flag in prompt_flags)
    assert all(flag["observed"] for flag in prompt_flags)


def test_custom_thresholds_are_supported() -> None:
    limits = RedFlagThresholds(
        temperature_warning_c=37.0,
        temperature_critical_c=38.0,
    )

    report = evaluate_red_flags(
        _data(temperature_c=37.5),
        thresholds=limits,
    )

    assert _codes(report) == ["TEMP_HIGH_WARNING"]
