"""JSON extraction, normalization and structural validation."""

from __future__ import annotations

import copy
import json
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from pydantic import ValidationError as PydanticValidationError

from .exceptions import ReportValidationError
from .schemas import MedicalReport, RiskLevel

RISK_VALUES = tuple(level.value for level in RiskLevel)
DECISION_VALUES = ("Yes", "No")
UNCERTAINTY_VALUES = ("Low", "Moderate", "High")

RISK_ALIASES = {"medium": "Moderate"}
DECISION_ALIASES = {
    "true": "Yes",
    "false": "No",
    "y": "Yes",
    "n": "No",
}
UNCERTAINTY_ALIASES = {"medium": "Moderate"}

POSSIBILITY_PREFIX_RE = re.compile(
    r"\b(possible|possibly|potential|potentially|risk of|risk for|concern for|"
    r"may|might|could)\b",
    re.IGNORECASE,
)

EVIDENCE_FIELD_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$")
EVIDENCE_NAMED_RE = re.compile(
    r"^\s*field\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*"
    r"value\s*=\s*(.+?)\s*$",
    re.IGNORECASE,
)

TOP_LEVEL_REQUIRED = (
    "overall_assessment",
    "detected_abnormalities",
    "possible_risks",
    "recommendations",
    "risk_level",
    "contact_flight_surgeon",
)


@dataclass
class ValidationResult:
    report: MedicalReport
    warnings: list[str] = field(default_factory=list)


def extract_json_object(raw: str) -> dict[str, Any]:
    """Extract the first complete JSON object from a model response."""
    if not isinstance(raw, str) or not raw.strip():
        raise ReportValidationError("Model output is empty.")

    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ReportValidationError("No JSON object found in model output.")

    candidate = text[start : end + 1]
    try:
        payload = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise ReportValidationError(
            f"Model output is not valid JSON: {exc.msg} at position {exc.pos}."
        ) from exc

    if not isinstance(payload, dict):
        raise ReportValidationError("Model output must be a JSON object.")
    return payload


def _normalize_enum(
    value: Any,
    allowed: tuple[str, ...],
    field_name: str,
    warnings: list[str],
    aliases: dict[str, str] | None = None,
) -> str:
    if isinstance(value, Enum):
        value = value.value
    if not isinstance(value, str):
        raise ReportValidationError(
            f"{field_name} must be a string, got {type(value).__name__}."
        )

    cleaned = value.strip().strip('"').strip("'").strip()
    lookup = cleaned.lower()
    if aliases and lookup in aliases:
        cleaned = aliases[lookup]
        lookup = cleaned.lower()

    for option in allowed:
        if lookup == option.lower():
            if cleaned != option:
                warnings.append(
                    f"Normalized {field_name} from {value!r} to {option!r}."
                )
            return option

    raise ReportValidationError(
        f"{field_name} must be one of {list(allowed)}, got {value!r}."
    )


def _text(value: Any, field_name: str, warnings: list[str]) -> str:
    if not isinstance(value, str):
        raise ReportValidationError(
            f"{field_name} must be a string, got {type(value).__name__}."
        )
    cleaned = value.strip()
    if not cleaned:
        raise ReportValidationError(f"{field_name} must not be empty.")
    if cleaned != value:
        warnings.append(f"Trimmed whitespace around {field_name}.")
    return cleaned


def _normalize_evidence(
    value: Any,
    field_name: str,
    warnings: list[str],
) -> dict[str, str]:
    """Normalize evidence to ``{"field": ..., "value": ...}``.

    The string legacy format ``field=value`` is accepted for tolerance, but the
    schema asks the model for a structured object.
    """
    if isinstance(value, str):
        text = value.strip()
        named = EVIDENCE_NAMED_RE.fullmatch(text)
        if named:
            field, raw_value = named.group(1), named.group(2)
        else:
            simple = EVIDENCE_FIELD_RE.fullmatch(text)
            if not simple:
                raise ReportValidationError(
                    f"{field_name} must be an object with field and value, "
                    f"or a 'field=value' string; got {value!r}."
                )
            field, raw_value = simple.group(1), simple.group(2)
        warnings.append(f"Converted {field_name} from string to structured evidence.")
        return {
            "field": field.strip(),
            "value": raw_value.strip(),
        }

    if not isinstance(value, dict):
        raise ReportValidationError(
            f"{field_name} must be an object with field and value."
        )
    if "field" not in value or "value" not in value:
        raise ReportValidationError(
            f"{field_name} must contain both field and value."
        )
    return {
        "field": _text(value["field"], f"{field_name}.field", warnings),
        "value": _text(value["value"], f"{field_name}.value", warnings),
    }


def _normalize_payload(
    payload: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    payload = copy.deepcopy(payload)
    warnings: list[str] = []

    missing = [key for key in TOP_LEVEL_REQUIRED if key not in payload]
    if missing:
        raise ReportValidationError(
            f"Missing required field(s): {', '.join(missing)}."
        )

    payload["overall_assessment"] = _text(
        payload.get("overall_assessment"), "overall_assessment", warnings
    )
    payload["risk_level"] = _normalize_enum(
        payload.get("risk_level"),
        RISK_VALUES,
        "risk_level",
        warnings,
        RISK_ALIASES,
    )

    abnormalities = payload.get("detected_abnormalities")
    if not isinstance(abnormalities, list):
        raise ReportValidationError("detected_abnormalities must be a list.")
    cleaned_abnormalities: list[dict[str, Any]] = []
    for index, item in enumerate(abnormalities):
        if isinstance(item, str):
            raise ReportValidationError(
                "detected_abnormalities items must be objects with parameter, "
                "observed, interpretation and evidence, not plain strings."
            )
        if not isinstance(item, dict):
            raise ReportValidationError(
                f"detected_abnormalities[{index}] must be an object."
            )
        item = copy.deepcopy(item)
        for key in ("parameter", "observed", "interpretation"):
            if key in item:
                item[key] = _text(
                    item[key],
                    f"detected_abnormalities[{index}].{key}",
                    warnings,
                )
        if "evidence" in item:
            item["evidence"] = _normalize_evidence(
                item["evidence"],
                f"detected_abnormalities[{index}].evidence",
                warnings,
            )
        cleaned_abnormalities.append(item)
    payload["detected_abnormalities"] = cleaned_abnormalities

    risks = payload.get("possible_risks")
    if not isinstance(risks, list):
        raise ReportValidationError("possible_risks must be a list.")
    cleaned_risks: list[dict[str, Any]] = []
    for index, item in enumerate(risks):
        if isinstance(item, str):
            raise ReportValidationError(
                "possible_risks items must be objects with risk, basis and "
                "uncertainty, not plain strings."
            )
        if not isinstance(item, dict):
            raise ReportValidationError(
                f"possible_risks[{index}] must be an object."
            )
        item = copy.deepcopy(item)
        if "risk" in item:
            risk_text = _text(
                item["risk"], f"possible_risks[{index}].risk", warnings
            )
            if not POSSIBILITY_PREFIX_RE.search(risk_text):
                risk_text = f"Possible {risk_text}"
                warnings.append(
                    f"Prefixed possible_risks[{index}].risk with 'Possible'."
                )
            item["risk"] = risk_text
        basis = item.get("basis")
        if isinstance(basis, list):
            item["basis"] = [
                _normalize_evidence(
                    value,
                    f"possible_risks[{index}].basis[{pos}]",
                    warnings,
                )
                for pos, value in enumerate(basis)
            ]
        if "uncertainty" in item:
            item["uncertainty"] = _normalize_enum(
                item["uncertainty"],
                UNCERTAINTY_VALUES,
                f"possible_risks[{index}].uncertainty",
                warnings,
                UNCERTAINTY_ALIASES,
            )
        cleaned_risks.append(item)
    payload["possible_risks"] = cleaned_risks

    recommendations = payload.get("recommendations")
    if not isinstance(recommendations, list):
        raise ReportValidationError("recommendations must be a list.")
    cleaned_recommendations: list[str] = []
    for index, item in enumerate(recommendations):
        cleaned_recommendations.append(
            _text(item, f"recommendations[{index}]", warnings)
        )
    payload["recommendations"] = cleaned_recommendations

    contact = payload.get("contact_flight_surgeon")
    if not isinstance(contact, dict):
        raise ReportValidationError(
            "contact_flight_surgeon must be an object with decision and reason."
        )
    contact = copy.deepcopy(contact)
    contact["decision"] = _normalize_enum(
        contact.get("decision"),
        DECISION_VALUES,
        "contact_flight_surgeon.decision",
        warnings,
        DECISION_ALIASES,
    )
    contact["reason"] = _text(
        contact.get("reason"),
        "contact_flight_surgeon.reason",
        warnings,
    )
    payload["contact_flight_surgeon"] = contact

    return payload, warnings


def _format_pydantic_error(exc: PydanticValidationError) -> str:
    parts: list[str] = []
    for error in exc.errors(include_url=False)[:8]:
        location = ".".join(str(part) for part in error["loc"])
        parts.append(f"{location}: {error['msg']}")
    return "Invalid report structure: " + "; ".join(parts)


def validate_report(raw: str) -> ValidationResult:
    """Parse and validate the raw model response against the report contract."""
    payload = extract_json_object(raw)
    payload, warnings = _normalize_payload(payload)

    try:
        report = MedicalReport.model_validate(payload)
    except PydanticValidationError as exc:
        raise ReportValidationError(_format_pydantic_error(exc)) from exc

    if report.overall_assessment.strip().lower() in {
        level.value.lower() for level in RiskLevel
    }:
        raise ReportValidationError(
            "overall_assessment must be a clinical summary, not only the risk level."
        )

    return ValidationResult(report=report, warnings=warnings)
