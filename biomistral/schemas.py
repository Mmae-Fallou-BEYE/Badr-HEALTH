"""Input and output contracts for the BioMistral AI module."""

from __future__ import annotations

import re
from enum import Enum
from typing import Annotated, Any

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

REPORT_SCHEMA_VERSION = "1.1"

CORE_FIELDS = (
    "mission_day",
    "temperature_c",
    "heart_rate_bpm",
    "blood_pressure",
    "spo2_pct",
    "sleep_hours",
)


class BloodPressure(BaseModel):
    model_config = ConfigDict(extra="forbid")

    systolic: int = Field(ge=40, le=300)
    diastolic: int = Field(ge=20, le=200)


class AstronautData(BaseModel):
    """Flexible medical input.

    Canonical field names carry their units. The aliases used in the project
    specification are accepted for compatibility with the database/backend.
    """

    model_config = ConfigDict(
        extra="allow",
        populate_by_name=True,
        str_strip_whitespace=True,
    )

    mission_day: int | None = Field(default=None, ge=0, le=100000)
    astronaut_id: str | None = Field(default=None, max_length=128)
    timestamp: str | None = Field(default=None, max_length=64)

    temperature_c: float | None = Field(
        default=None,
        validation_alias=AliasChoices("temperature_c", "temperature"),
        ge=25.0,
        le=45.0,
    )
    heart_rate_bpm: int | None = Field(
        default=None,
        validation_alias=AliasChoices("heart_rate_bpm", "heart_rate"),
        ge=20,
        le=250,
    )
    blood_pressure: BloodPressure | None = Field(
        default=None,
        validation_alias=AliasChoices("blood_pressure", "bp"),
    )
    spo2_pct: float | None = Field(
        default=None,
        validation_alias=AliasChoices("spo2_pct", "spo2"),
        ge=0.0,
        le=100.0,
    )
    sleep_hours: float | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "sleep_hours", "sleep_duration", "sleep_duration_hours"
        ),
        ge=0.0,
        le=24.0,
    )
    sleep_quality: str | None = Field(default=None, max_length=64)
    mood: str | None = Field(default=None, max_length=256)
    stress_level: str | None = Field(default=None, max_length=64)
    fatigue: str | None = Field(default=None, max_length=256)
    exercise_minutes: float | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "exercise_minutes", "exercise_duration_minutes"
        ),
        ge=0.0,
        le=1440.0,
    )
    symptoms: list[str] = Field(default_factory=list, max_length=50)
    radiation_daily_msv: float | None = Field(
        default=None,
        validation_alias=AliasChoices("radiation_daily_msv", "radiation_daily"),
        ge=0.0,
        le=1000.0,
    )
    radiation_cumulative_msv: float | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "radiation_cumulative_msv", "radiation_cumulative"
        ),
        ge=0.0,
        le=100000.0,
    )
    notes: str | None = Field(default=None, max_length=4000)

    @field_validator("blood_pressure", mode="before")
    @classmethod
    def _parse_blood_pressure(cls, value: Any) -> Any:
        if value is None or isinstance(value, dict):
            return value
        if isinstance(value, str):
            match = re.fullmatch(r"\s*(\d{2,3})\s*/\s*(\d{2,3})\s*", value)
            if not match:
                raise ValueError(
                    "blood_pressure must be 'systolic/diastolic' or an object "
                    "with systolic and diastolic integers"
                )
            return {
                "systolic": int(match.group(1)),
                "diastolic": int(match.group(2)),
            }
        return value

    @field_validator("symptoms", mode="before")
    @classmethod
    def _parse_symptoms(cls, value: Any) -> Any:
        if value is None:
            return []
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def to_canonical_dict(self) -> dict[str, Any]:
        """Return a JSON-ready dict using canonical field names and units."""
        return self.model_dump(mode="json", exclude_none=True, by_alias=False)

    def missing_core_fields(self) -> list[str]:
        """Return the core measurements that were not supplied."""
        missing: list[str] = []
        for name in CORE_FIELDS:
            value = getattr(self, name)
            if value is None or value == [] or value == "":
                missing.append(name)
        return missing


class RiskLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"


class FlightSurgeonDecision(str, Enum):
    YES = "Yes"
    NO = "No"


class UncertaintyLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"


Recommendation = Annotated[str, Field(min_length=1, max_length=1000)]


class EvidenceRef(BaseModel):
    """A single measurement reference copied from the input data."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    field: str = Field(min_length=1, max_length=128)
    value: str = Field(min_length=1, max_length=128)


class Abnormality(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    parameter: str = Field(min_length=1, max_length=128)
    observed: str = Field(min_length=1, max_length=128)
    interpretation: str = Field(min_length=1, max_length=1000)
    evidence: EvidenceRef


class PossibleRisk(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    risk: str = Field(min_length=1, max_length=500)
    basis: list[EvidenceRef] = Field(min_length=1, max_length=10)
    uncertainty: UncertaintyLevel


class ContactFlightSurgeon(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    decision: FlightSurgeonDecision
    reason: str = Field(min_length=1, max_length=1000)


class MedicalReport(BaseModel):
    """Structured report returned by BioMistral (Option B contract)."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    overall_assessment: str = Field(min_length=20, max_length=3000)
    detected_abnormalities: list[Abnormality] = Field(
        default_factory=list, max_length=20
    )
    possible_risks: list[PossibleRisk] = Field(
        default_factory=list, max_length=20
    )
    recommendations: list[Recommendation] = Field(
        default_factory=list, max_length=20
    )
    risk_level: RiskLevel
    contact_flight_surgeon: ContactFlightSurgeon


# Hand-written schema kept deliberately simple: no $defs/$ref constructs,
# because it is passed directly to Ollama's structured-output grammar.
REPORT_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "overall_assessment": {"type": "string"},
        "detected_abnormalities": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "parameter": {"type": "string"},
                    "observed": {"type": "string"},
                    "interpretation": {"type": "string"},
                    "evidence": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "value": {"type": "string"},
                        },
                        "required": ["field", "value"],
                        "additionalProperties": False,
                    },
                },
                "required": [
                    "parameter",
                    "observed",
                    "interpretation",
                    "evidence",
                ],
                "additionalProperties": False,
            },
        },
        "possible_risks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "risk": {"type": "string"},
                    "basis": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "field": {"type": "string"},
                                "value": {"type": "string"},
                            },
                            "required": ["field", "value"],
                            "additionalProperties": False,
                        },
                    },
                    "uncertainty": {
                        "type": "string",
                        "enum": ["Low", "Moderate", "High"],
                    },
                },
                "required": ["risk", "basis", "uncertainty"],
                "additionalProperties": False,
            },
        },
        "recommendations": {
            "type": "array",
            "items": {"type": "string"},
        },
        "risk_level": {
            "type": "string",
            "enum": ["Low", "Moderate", "High"],
        },
        "contact_flight_surgeon": {
            "type": "object",
            "properties": {
                "decision": {"type": "string", "enum": ["Yes", "No"]},
                "reason": {"type": "string"},
            },
            "required": ["decision", "reason"],
            "additionalProperties": False,
        },
    },
    "required": [
        "overall_assessment",
        "detected_abnormalities",
        "possible_risks",
        "recommendations",
        "risk_level",
        "contact_flight_surgeon",
    ],
    "additionalProperties": False,
}
