"""Deterministic screening flags evaluated before the BioMistral call.

This module only reads validated astronaut data. It never mutates the input and
never writes fields of the medical report produced by the model. Flags are
triage context, not diagnoses, and they do not replace BioMistral's analysis.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .schemas import AstronautData

RULE_SET_VERSION = "1.0"
SCREENING_NOTE = "Deterministic screening only; not a diagnosis."


class FlagSeverity(str, Enum):
    INFO = "Info"
    WARNING = "Warning"
    CRITICAL = "Critical"


_SEVERITY_ORDER = {
    FlagSeverity.CRITICAL: 0,
    FlagSeverity.WARNING: 1,
    FlagSeverity.INFO: 2,
}


@dataclass(frozen=True, slots=True)
class RedFlagThresholds:
    """Default adult screening thresholds.

    These are deliberately conservative screening values, not spaceflight
    medical limits. They are injectable so a flight surgeon can validate or
    adapt them for a mission without changing the rule engine.
    """

    temperature_elevated_c: float = 37.5
    temperature_warning_c: float = 38.0
    temperature_critical_c: float = 39.0
    temperature_low_warning_c: float = 36.0
    temperature_low_critical_c: float = 35.0

    heart_rate_high_warning_bpm: float = 100.0
    heart_rate_high_critical_bpm: float = 130.0
    heart_rate_low_warning_bpm: float = 50.0
    heart_rate_low_critical_bpm: float = 40.0

    systolic_high_warning_mmhg: float = 140.0
    systolic_high_critical_mmhg: float = 180.0
    diastolic_high_warning_mmhg: float = 90.0
    diastolic_high_critical_mmhg: float = 120.0
    systolic_low_warning_mmhg: float = 90.0
    systolic_low_critical_mmhg: float = 80.0
    diastolic_low_warning_mmhg: float = 60.0
    diastolic_low_critical_mmhg: float = 50.0
    systolic_borderline_mmhg: float = 130.0
    diastolic_borderline_mmhg: float = 80.0

    spo2_warning_pct: float = 95.0
    spo2_critical_pct: float = 90.0

    sleep_info_hours: float = 7.0
    sleep_warning_hours: float = 6.0


class RedFlag(BaseModel):
    """A single deterministic screening flag."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    code: str = Field(min_length=1, max_length=64)
    severity: FlagSeverity
    field: str = Field(min_length=1, max_length=64)
    observed: str = Field(min_length=1, max_length=64)
    unit: str = Field(min_length=1, max_length=32)
    threshold: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1, max_length=500)

    def to_prompt_dict(self) -> dict[str, Any]:
        """Return the flag as sent to the model, without threshold values.

        Threshold strings contain numbers that are not part of the input. If
        they were sent to BioMistral, it could copy them into its report and
        trigger the grounding checks.
        """
        payload = self.model_dump(mode="json")
        payload.pop("threshold", None)
        return payload


class RedFlagReport(BaseModel):
    """Envelope for deterministic screening results."""

    model_config = ConfigDict(extra="forbid")

    rule_set_version: str = RULE_SET_VERSION
    highest_severity: FlagSeverity | None = None
    evaluated_fields: list[str] = Field(default_factory=list)
    flags: list[RedFlag] = Field(default_factory=list)
    note: str = SCREENING_NOTE

    def to_prompt_flags(self) -> list[dict[str, Any]]:
        return [flag.to_prompt_dict() for flag in self.flags]


def _format_number(value: float) -> str:
    return f"{value:g}"


def _format_decimal(value: float) -> str:
    return f"{value:.1f}"


def evaluate_red_flags(
    data: AstronautData,
    *,
    thresholds: RedFlagThresholds | None = None,
) -> RedFlagReport:
    """Evaluate deterministic screening rules on validated astronaut data.

    The function is pure: it reads ``data`` and returns a new report. It never
    modifies the measurements and never produces a diagnosis or a risk level.
    """
    limits = thresholds or RedFlagThresholds()
    flags: list[RedFlag] = []
    evaluated_fields: list[str] = []

    def add(
        code: str,
        severity: FlagSeverity,
        field: str,
        observed: str,
        unit: str,
        threshold: str,
        message: str,
    ) -> None:
        flags.append(
            RedFlag(
                code=code,
                severity=severity,
                field=field,
                observed=observed,
                unit=unit,
                threshold=threshold,
                message=message,
            )
        )

    if data.temperature_c is not None:
        evaluated_fields.append("temperature_c")
        value = data.temperature_c
        if value >= limits.temperature_critical_c:
            add(
                "TEMP_HIGH_CRITICAL",
                FlagSeverity.CRITICAL,
                "temperature_c",
                _format_number(value),
                "C",
                f">= {_format_decimal(limits.temperature_critical_c)} C",
                "Temperature is at or above the high-fever screening threshold. "
                "Verify the measurement and seek prompt clinical review.",
            )
        elif value >= limits.temperature_warning_c:
            add(
                "TEMP_HIGH_WARNING",
                FlagSeverity.WARNING,
                "temperature_c",
                _format_number(value),
                "C",
                f">= {_format_decimal(limits.temperature_warning_c)} C",
                "Temperature is above the fever screening threshold. "
                "Verify the measurement and clinical context.",
            )
        elif value >= limits.temperature_elevated_c:
            add(
                "TEMP_ELEVATED_INFO",
                FlagSeverity.INFO,
                "temperature_c",
                _format_number(value),
                "C",
                f">= {_format_decimal(limits.temperature_elevated_c)} C",
                "Temperature is slightly above the usual resting range. "
                "Verify the measurement and clinical context.",
            )
        elif value < limits.temperature_low_critical_c:
            add(
                "TEMP_LOW_CRITICAL",
                FlagSeverity.CRITICAL,
                "temperature_c",
                _format_number(value),
                "C",
                f"< {_format_decimal(limits.temperature_low_critical_c)} C",
                "Temperature is below the low-temperature screening threshold. "
                "Verify the measurement and seek prompt clinical review.",
            )
        elif value < limits.temperature_low_warning_c:
            add(
                "TEMP_LOW_WARNING",
                FlagSeverity.WARNING,
                "temperature_c",
                _format_number(value),
                "C",
                f"< {_format_decimal(limits.temperature_low_warning_c)} C",
                "Temperature is below the usual resting range. "
                "Verify the measurement and clinical context.",
            )

    if data.heart_rate_bpm is not None:
        evaluated_fields.append("heart_rate_bpm")
        value = data.heart_rate_bpm
        if value >= limits.heart_rate_high_critical_bpm:
            add(
                "HR_HIGH_CRITICAL",
                FlagSeverity.CRITICAL,
                "heart_rate_bpm",
                _format_number(value),
                "bpm",
                f">= {_format_number(limits.heart_rate_high_critical_bpm)} bpm",
                "Heart rate is at or above the severe high-rate screening "
                "threshold. Verify the measurement and seek prompt clinical review.",
            )
        elif value > limits.heart_rate_high_warning_bpm:
            add(
                "HR_HIGH_WARNING",
                FlagSeverity.WARNING,
                "heart_rate_bpm",
                _format_number(value),
                "bpm",
                f"> {_format_number(limits.heart_rate_high_warning_bpm)} bpm",
                "Heart rate is above the resting upper screening threshold. "
                "Interpret in clinical context.",
            )
        elif value < limits.heart_rate_low_critical_bpm:
            add(
                "HR_LOW_CRITICAL",
                FlagSeverity.CRITICAL,
                "heart_rate_bpm",
                _format_number(value),
                "bpm",
                f"< {_format_number(limits.heart_rate_low_critical_bpm)} bpm",
                "Heart rate is below the severe low-rate screening threshold. "
                "Verify the measurement and seek prompt clinical review.",
            )
        elif value < limits.heart_rate_low_warning_bpm:
            add(
                "HR_LOW_WARNING",
                FlagSeverity.WARNING,
                "heart_rate_bpm",
                _format_number(value),
                "bpm",
                f"< {_format_number(limits.heart_rate_low_warning_bpm)} bpm",
                "Heart rate is below the resting lower screening threshold. "
                "Interpret in clinical context.",
            )

    if data.blood_pressure is not None:
        evaluated_fields.append("blood_pressure")
        systolic = data.blood_pressure.systolic
        diastolic = data.blood_pressure.diastolic
        observed = f"{systolic}/{diastolic}"
        high_critical = (
            systolic >= limits.systolic_high_critical_mmhg
            or diastolic >= limits.diastolic_high_critical_mmhg
        )
        high_warning = (
            systolic >= limits.systolic_high_warning_mmhg
            or diastolic >= limits.diastolic_high_warning_mmhg
        )
        low_critical = (
            systolic < limits.systolic_low_critical_mmhg
            or diastolic < limits.diastolic_low_critical_mmhg
        )
        low_warning = (
            systolic < limits.systolic_low_warning_mmhg
            or diastolic < limits.diastolic_low_warning_mmhg
        )
        borderline = (
            systolic >= limits.systolic_borderline_mmhg
            or diastolic >= limits.diastolic_borderline_mmhg
        )

        if high_critical:
            add(
                "BP_HIGH_CRITICAL",
                FlagSeverity.CRITICAL,
                "blood_pressure",
                observed,
                "mmHg",
                f">= {_format_number(limits.systolic_high_critical_mmhg)}/"
                f"{_format_number(limits.diastolic_high_critical_mmhg)} mmHg",
                "Blood pressure is in the severe high screening range. "
                "Repeat the measurement and seek prompt clinical review.",
            )
        elif low_critical:
            add(
                "BP_LOW_CRITICAL",
                FlagSeverity.CRITICAL,
                "blood_pressure",
                observed,
                "mmHg",
                f"< {_format_number(limits.systolic_low_critical_mmhg)}/"
                f"{_format_number(limits.diastolic_low_critical_mmhg)} mmHg",
                "Blood pressure is in the severe low screening range. "
                "Repeat the measurement and seek prompt clinical review.",
            )
        elif high_warning:
            add(
                "BP_HIGH_WARNING",
                FlagSeverity.WARNING,
                "blood_pressure",
                observed,
                "mmHg",
                f">= {_format_number(limits.systolic_high_warning_mmhg)}/"
                f"{_format_number(limits.diastolic_high_warning_mmhg)} mmHg",
                "Blood pressure is above the screening threshold. "
                "Repeat the measurement and interpret in clinical context.",
            )
        elif low_warning:
            add(
                "BP_LOW_WARNING",
                FlagSeverity.WARNING,
                "blood_pressure",
                observed,
                "mmHg",
                f"< {_format_number(limits.systolic_low_warning_mmhg)}/"
                f"{_format_number(limits.diastolic_low_warning_mmhg)} mmHg",
                "Blood pressure is below the screening threshold. "
                "Verify the measurement and clinical context.",
            )
        elif borderline:
            add(
                "BP_BORDERLINE_INFO",
                FlagSeverity.INFO,
                "blood_pressure",
                observed,
                "mmHg",
                f">= {_format_number(limits.systolic_borderline_mmhg)}/"
                f"{_format_number(limits.diastolic_borderline_mmhg)} mmHg",
                "Blood pressure is slightly above the usual resting range. "
                "Interpret in clinical context.",
            )

    if data.spo2_pct is not None:
        evaluated_fields.append("spo2_pct")
        value = data.spo2_pct
        if value < limits.spo2_critical_pct:
            add(
                "SPO2_CRITICAL",
                FlagSeverity.CRITICAL,
                "spo2_pct",
                _format_number(value),
                "%",
                f"< {_format_number(limits.spo2_critical_pct)} %",
                "Oxygen saturation is below the critical screening threshold. "
                "Verify sensor placement and clinical status.",
            )
        elif value < limits.spo2_warning_pct:
            add(
                "SPO2_LOW_WARNING",
                FlagSeverity.WARNING,
                "spo2_pct",
                _format_number(value),
                "%",
                f"< {_format_number(limits.spo2_warning_pct)} %",
                "Oxygen saturation is below the usual screening range. "
                "Verify sensor placement and clinical status.",
            )

    if data.sleep_hours is not None:
        evaluated_fields.append("sleep_hours")
        value = data.sleep_hours
        if value < limits.sleep_warning_hours:
            add(
                "SLEEP_SHORT_WARNING",
                FlagSeverity.WARNING,
                "sleep_hours",
                _format_number(value),
                "h",
                f"< {_format_decimal(limits.sleep_warning_hours)} h",
                "Sleep duration is below the recovery screening threshold. "
                "Interpret in clinical context.",
            )
        elif value < limits.sleep_info_hours:
            add(
                "SLEEP_INSUFFICIENT_INFO",
                FlagSeverity.INFO,
                "sleep_hours",
                _format_number(value),
                "h",
                f"< {_format_decimal(limits.sleep_info_hours)} h",
                "Sleep duration is slightly below the usual recovery range. "
                "Interpret in clinical context.",
            )

    flags.sort(key=lambda flag: _SEVERITY_ORDER[flag.severity])
    return RedFlagReport(
        highest_severity=flags[0].severity if flags else None,
        evaluated_fields=evaluated_fields,
        flags=flags,
    )
