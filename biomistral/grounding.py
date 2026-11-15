"""Deterministic grounding checks for BioMistral reports.

Structured output guarantees the shape of a report, not its truth. This module
checks that claims are anchored in the supplied astronaut data and removes
unsupported claims if the model cannot produce a clean report after retries.
"""

from __future__ import annotations

import json
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

from .schemas import EvidenceRef, FlightSurgeonDecision, MedicalReport, RiskLevel

EVIDENCE_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$")
NUMBER_RE = re.compile(r"(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])")

FIELD_ALIASES = {
    "temperature": "temperature_c",
    "heart_rate": "heart_rate_bpm",
    "spo2": "spo2_pct",
    "sleep_duration": "sleep_hours",
    "sleep_duration_hours": "sleep_hours",
    "radiation_daily": "radiation_daily_msv",
    "radiation_cumulative": "radiation_cumulative_msv",
    "bp": "blood_pressure",
}

FORBIDDEN_CLAIM_PATTERNS = (
    r"\bhistory of\b",
    r"\bmedical history\b",
    r"\bfamily history\b",
    r"\bdiagnosed (?:with|as)\b",
    r"\bprevious(?:ly)?\b",
    r"\bmedications?\b",
    r"\ballerg(?:y|ies)\b",
    r"\bsince\b",
    r"\bsuffers? from\b",
    r"\bknown (?:case|condition)\b",
    r"\bhas been (?:taking|treated)\b",
    r"\b(?:may|might|could)\s+be\s+(?:related to|caused by|due to|associated with)\b",
    r"\b(?:may|might|could)\s+(?:affect|increase|decrease|contribute|lead)\b",
    r"\b(?:due to|caused by|because of|as a result of|secondary to)\b",
    r"\brelated to\b",
    r"\bassociated with\b",
    r"\bincreas(?:e|es|ed|ing)\s+(?:the\s+)?risk\b",
    r"\blead(?:s|ing)? to\b",
    r"\bcontribute(?:s|d|ing)? to\b",
    r"\bresult(?:s|ing)? from\b",
)

ASSESSMENT_RECOMMENDATION_RE = re.compile(
    r"\b(should|must|recommend|advised?|encourage)\b",
    re.IGNORECASE,
)
UNCERTAINTY_RE = re.compile(
    r"\b(insufficient data|no cause|cannot be (?:established|determined)|"
    r"not enough data|unknown|uncertain)\b",
    re.IGNORECASE,
)

BP_TEXT_RE = re.compile(r"(?<!\d)(\d{2,3})\s*/\s*(\d{2,3})(?!\d)")
MAX_ASSESSMENT_SENTENCES = 4

POSSIBILITY_RE = re.compile(
    r"\b(possible|possibly|potential|potentially|risk|concern|may|might|could|"
    r"uncertain|suspected|suspicion)\b",
    re.IGNORECASE,
)
PRESCRIPTION_RE = re.compile(
    r"\b(prescribe|prescription|dosage|tablet|capsule)\b|"
    r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|ml)\b",
    re.IGNORECASE,
)

RISK_LABELS = {level.value.lower() for level in RiskLevel}


@dataclass
class GroundingResult:
    report: MedicalReport
    violations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    needs_review: bool = False


def _canonical_field(name: str) -> str:
    key = name.strip().lower()
    return FIELD_ALIASES.get(key, key)


def flatten_input(data: Mapping[str, Any]) -> dict[str, str]:
    """Flatten canonical input into ``field -> text`` for evidence checks."""
    fields: dict[str, str] = {}
    for key, value in data.items():
        if value is None:
            continue
        canonical_key = _canonical_field(key)
        if canonical_key == "blood_pressure":
            if isinstance(value, Mapping):
                systolic = value.get("systolic")
                diastolic = value.get("diastolic")
                if systolic is not None and diastolic is not None:
                    fields["blood_pressure"] = f"{systolic}/{diastolic}"
                    fields["blood_pressure_systolic"] = str(systolic)
                    fields["blood_pressure_diastolic"] = str(diastolic)
                continue
            if isinstance(value, str):
                match = re.fullmatch(
                    r"\s*(\d{2,3})\s*/\s*(\d{2,3})\s*", value
                )
                if match:
                    fields["blood_pressure"] = (
                        f"{match.group(1)}/{match.group(2)}"
                    )
                    fields["blood_pressure_systolic"] = match.group(1)
                    fields["blood_pressure_diastolic"] = match.group(2)
                    continue
        if isinstance(value, bool):
            fields[canonical_key] = "true" if value else "false"
        elif isinstance(value, (list, tuple)):
            if value:
                fields[canonical_key] = ", ".join(str(item) for item in value)
        elif isinstance(value, Mapping):
            fields[canonical_key] = json.dumps(
                value, ensure_ascii=False, sort_keys=True
            )
        else:
            text = str(value).strip()
            if text:
                fields[canonical_key] = text
    return fields


def _numbers(text: str) -> list[float]:
    return [float(match) for match in NUMBER_RE.findall(text or "")]


def _numbers_match(left: list[float], right: list[float]) -> bool:
    if len(left) != len(right):
        return False
    return all(
        abs(a - b) <= 1e-6
        for a, b in zip(sorted(left), sorted(right), strict=True)
    )


def _values_match(expected: str, observed: str) -> bool:
    expected_text = expected.strip().lower()
    observed_text = observed.strip().lower()
    if expected_text == observed_text:
        return True
    expected_numbers = _numbers(expected_text)
    observed_numbers = _numbers(observed_text)
    if expected_numbers and observed_numbers:
        return _numbers_match(expected_numbers, observed_numbers)
    return False


def _parse_evidence(evidence: EvidenceRef | str) -> tuple[str, str] | None:
    if isinstance(evidence, EvidenceRef):
        return evidence.field.strip(), evidence.value.strip()
    if isinstance(evidence, str):
        match = EVIDENCE_RE.fullmatch(evidence)
        if match:
            return match.group(1), match.group(2).strip()
    return None


def _validate_evidence(
    evidence: EvidenceRef | str, fields: Mapping[str, str]
) -> list[str]:
    parsed = _parse_evidence(evidence)
    if parsed is None:
        return [f"evidence must use 'field=value' format, got {evidence!r}"]
    field_name, value = parsed
    canonical = _canonical_field(field_name)
    if canonical not in fields:
        return [f"evidence references unknown field {field_name!r}"]
    if not _values_match(fields[canonical], value):
        return [
            f"evidence value {value!r} does not match "
            f"{canonical}={fields[canonical]!r}"
        ]
    return []


def _allowed_numbers(fields: Mapping[str, str]) -> set[float]:
    allowed = {0.0, 100.0}
    for value in fields.values():
        allowed.update(_numbers(value))
    return allowed


def _number_is_allowed(number: float, allowed: set[float]) -> bool:
    return any(abs(number - candidate) <= 1e-6 for candidate in allowed)


def _unknown_numbers(text: str, allowed: set[float]) -> list[float]:
    return [number for number in _numbers(text) if not _number_is_allowed(number, allowed)]


def _forbidden_claims(text: str, input_text: str) -> list[str]:
    found: list[str] = []
    for pattern in FORBIDDEN_CLAIM_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            phrase = match.group(0).lower()
            if phrase not in input_text:
                found.append(match.group(0))
    return list(dict.fromkeys(found))


def _input_numbers(fields: Mapping[str, str]) -> set[float]:
    numbers: set[float] = set()
    for value in fields.values():
        numbers.update(_numbers(value))
    return numbers


def _has_data_reference(text: str, fields: Mapping[str, str]) -> bool:
    lowered = text.lower()
    if any(name.lower() in lowered for name in fields):
        return True
    input_numbers = _input_numbers(fields)
    return any(
        _number_is_allowed(number, input_numbers) for number in _numbers(text)
    )


def _sentence_count(text: str) -> int:
    return len(_split_sentences(text))


def _split_sentences(text: str) -> list[str]:
    return [
        part.strip()
        for part in re.split(r"(?<=[.!?])\s+", text.strip())
        if part.strip()
    ]


def _safe_sentences(
    text: str,
    fields: Mapping[str, str],
    input_text: str,
    allowed_numbers: set[float],
) -> list[str]:
    """Keep only sentences that are grounded and free of recommendations."""
    safe: list[str] = []
    for sentence in _split_sentences(text):
        if _forbidden_claims(sentence, input_text):
            continue
        if _unknown_numbers(sentence, allowed_numbers):
            continue
        if _blood_pressure_order_issues(sentence, fields):
            continue
        if ASSESSMENT_RECOMMENDATION_RE.search(sentence):
            continue
        if not _has_data_reference(sentence, fields) and not UNCERTAINTY_RE.search(
            sentence
        ):
            continue
        safe.append(sentence)
    return safe


def _blood_pressure_order_issues(
    text: str, fields: Mapping[str, str]
) -> list[str]:
    expected = fields.get("blood_pressure")
    if not expected:
        return []
    issues: list[str] = []
    for match in BP_TEXT_RE.finditer(text):
        candidate = f"{match.group(1)}/{match.group(2)}"
        if candidate == expected:
            continue
        if _values_match(candidate, expected):
            issues.append(
                f"blood pressure {candidate} appears reversed; provided value is {expected}"
            )
    return issues


def _check_text(
    text: str,
    location: str,
    fields: Mapping[str, str],
    input_text: str,
    allowed_numbers: set[float],
    violations: list[str],
) -> None:
    for claim in _forbidden_claims(text, input_text):
        violations.append(
            f"{location}: unsupported claim {claim!r}; this information was not provided"
        )
    for number in _unknown_numbers(text, allowed_numbers):
        violations.append(
            f"{location}: number {number:g} is not present in the provided data"
        )
    for issue in _blood_pressure_order_issues(text, fields):
        violations.append(f"{location}: {issue}")


def check_grounding(
    report: MedicalReport,
    astronaut_data: Mapping[str, Any],
) -> GroundingResult:
    """Check that every medical claim is anchored in the provided data."""
    fields = flatten_input(astronaut_data)
    input_text = " ".join(fields.values()).lower()
    allowed_numbers = _allowed_numbers(fields)
    violations: list[str] = []
    warnings: list[str] = []

    _check_text(
        report.overall_assessment,
        "overall_assessment",
        fields,
        input_text,
        allowed_numbers,
        violations,
    )
    if _sentence_count(report.overall_assessment) > MAX_ASSESSMENT_SENTENCES:
        violations.append(
            "overall_assessment must contain at most "
            f"{MAX_ASSESSMENT_SENTENCES} sentences"
        )
    ungrounded_sentences = [
        sentence
        for sentence in _split_sentences(report.overall_assessment)
        if not _has_data_reference(sentence, fields)
        and not UNCERTAINTY_RE.search(sentence)
    ]
    if ungrounded_sentences:
        violations.append(
            "overall_assessment: each sentence must cite a provided measurement "
            "or state uncertainty"
        )
    if report.overall_assessment.strip().lower() in RISK_LABELS:
        violations.append(
            "overall_assessment must be a clinical summary, not only the risk level"
        )

    for index, item in enumerate(report.detected_abnormalities):
        location = f"detected_abnormalities[{index}]"
        _check_text(
            item.observed,
            f"{location}.observed",
            fields,
            input_text,
            allowed_numbers,
            violations,
        )
        _check_text(
            item.interpretation,
            f"{location}.interpretation",
            fields,
            input_text,
            allowed_numbers,
            violations,
        )

        parameter = _canonical_field(item.parameter)
        if parameter not in fields:
            violations.append(
                f"{location}.parameter: unknown field {item.parameter!r}"
            )
        parsed = _parse_evidence(item.evidence)
        for error in _validate_evidence(item.evidence, fields):
            violations.append(f"{location}: {error}")
        if parsed is not None:
            evidence_field, evidence_value = parsed
            if _canonical_field(evidence_field) != parameter:
                violations.append(
                    f"{location}: parameter {item.parameter!r} does not match "
                    f"evidence field {evidence_field!r}"
                )
            if not _values_match(item.observed, evidence_value):
                violations.append(
                    f"{location}: observed value {item.observed!r} does not match "
                    f"evidence value {evidence_value!r}"
                )

    for index, item in enumerate(report.possible_risks):
        location = f"possible_risks[{index}]"
        _check_text(
            item.risk,
            f"{location}.risk",
            fields,
            input_text,
            allowed_numbers,
            violations,
        )
        if not POSSIBILITY_RE.search(item.risk):
            warnings.append(
                f"{location}.risk: phrase the risk as a possibility, not a diagnosis"
            )
        if not item.basis:
            violations.append(f"{location}.basis: at least one evidence reference is required")
        for basis_index, basis in enumerate(item.basis):
            for error in _validate_evidence(basis, fields):
                violations.append(f"{location}.basis[{basis_index}]: {error}")

    reason = report.contact_flight_surgeon.reason
    _check_text(
        reason,
        "contact_flight_surgeon.reason",
        fields,
        input_text,
        allowed_numbers,
        violations,
    )
    if not _has_data_reference(reason, fields):
        violations.append(
            "contact_flight_surgeon.reason: cite at least one provided measurement or field"
        )
    if (
        report.risk_level == RiskLevel.HIGH
        and report.contact_flight_surgeon.decision != FlightSurgeonDecision.YES
    ):
        violations.append(
            "contact_flight_surgeon.decision: High risk requires 'Yes'"
        )

    for index, recommendation in enumerate(report.recommendations):
        if PRESCRIPTION_RE.search(recommendation):
            violations.append(
                f"recommendations[{index}]: avoid prescriptions, doses or drug names"
            )

    return GroundingResult(
        report=report,
        violations=list(dict.fromkeys(violations)),
        warnings=list(dict.fromkeys(warnings)),
        needs_review=bool(violations),
    )


def sanitize_report(
    report: MedicalReport,
    astronaut_data: Mapping[str, Any],
) -> tuple[MedicalReport, list[str]]:
    """Remove or replace unsupported content after all retries are exhausted."""
    fields = flatten_input(astronaut_data)
    input_text = " ".join(fields.values()).lower()
    allowed_numbers = _allowed_numbers(fields)
    warnings: list[str] = []

    abnormalities = []
    for item in report.detected_abnormalities:
        parameter = _canonical_field(item.parameter)
        parsed = _parse_evidence(item.evidence)
        unsupported = bool(_validate_evidence(item.evidence, fields))
        if parameter not in fields:
            unsupported = True
        if _forbidden_claims(item.interpretation, input_text):
            unsupported = True
        if _unknown_numbers(item.interpretation, allowed_numbers):
            unsupported = True
        if _unknown_numbers(item.observed, allowed_numbers):
            unsupported = True
        if _blood_pressure_order_issues(item.observed, fields):
            unsupported = True
        if _blood_pressure_order_issues(item.interpretation, fields):
            unsupported = True
        if parsed is not None:
            if _canonical_field(parsed[0]) != parameter:
                unsupported = True
            if not _values_match(item.observed, parsed[1]):
                unsupported = True
        if unsupported:
            warnings.append(
                f"Dropped unsupported abnormality: {item.interpretation!r}."
            )
        else:
            abnormalities.append(item)

    risks = []
    for item in report.possible_risks:
        unsupported = False
        for basis in item.basis:
            if _validate_evidence(basis, fields):
                unsupported = True
                break
        if _forbidden_claims(item.risk, input_text):
            unsupported = True
        if _unknown_numbers(item.risk, allowed_numbers):
            unsupported = True
        if _blood_pressure_order_issues(item.risk, fields):
            unsupported = True
        if unsupported:
            warnings.append(f"Dropped unsupported risk: {item.risk!r}.")
        else:
            risks.append(item)

    recommendations = [
        item for item in report.recommendations if not PRESCRIPTION_RE.search(item)
    ]
    if len(recommendations) != len(report.recommendations):
        warnings.append("Dropped prescriptive recommendation(s).")

    assessment = report.overall_assessment
    if (
        _forbidden_claims(assessment, input_text)
        or _unknown_numbers(assessment, allowed_numbers)
        or _blood_pressure_order_issues(assessment, fields)
        or _sentence_count(assessment) > MAX_ASSESSMENT_SENTENCES
        or any(
            not _has_data_reference(sentence, fields)
            and not UNCERTAINTY_RE.search(sentence)
            for sentence in _split_sentences(assessment)
        )
        or assessment.strip().lower() in RISK_LABELS
    ):
        safe_sentences = _safe_sentences(
            assessment, fields, input_text, allowed_numbers
        )
        if safe_sentences:
            assessment = " ".join(safe_sentences[:MAX_ASSESSMENT_SENTENCES])
            warnings.append(
                "Removed unsupported or recommendation-like sentences from "
                "overall assessment."
            )
        elif abnormalities:
            first = abnormalities[0]
            assessment = (
                f"Automated analysis identified {len(abnormalities)} grounded "
                f"abnormal finding(s), led by {first.parameter} "
                f"({first.observed}). Manual medical review is required."
            )
            warnings.append("Replaced unsupported overall assessment.")
        else:
            assessment = (
                "Automated analysis produced insufficient grounded evidence. "
                "Manual medical review is required."
            )
            warnings.append("Replaced unsupported overall assessment.")

    reason = report.contact_flight_surgeon.reason
    if (
        _forbidden_claims(reason, input_text)
        or _unknown_numbers(reason, allowed_numbers)
        or _blood_pressure_order_issues(reason, fields)
        or not _has_data_reference(reason, fields)
    ):
        if abnormalities:
            count = len(abnormalities)
            suffix = "" if count == 1 else "s"
            reason = (
                f"Automated analysis identified {count} grounded abnormal "
                f"finding{suffix}; flight surgeon review is required."
            )
        else:
            reason = (
                "Automated report requires flight surgeon review due to "
                "validation warnings."
            )
        warnings.append("Replaced unsupported flight surgeon justification.")

    decision = report.contact_flight_surgeon.decision
    if report.risk_level == RiskLevel.HIGH and decision != FlightSurgeonDecision.YES:
        decision = FlightSurgeonDecision.YES
        reason = "High risk level requires flight surgeon review. " + reason
        warnings.append("Escalated flight surgeon contact for High risk.")

    contact = report.contact_flight_surgeon.model_copy(
        update={"decision": decision, "reason": reason}
    )
    sanitized = report.model_copy(
        update={
            "overall_assessment": assessment,
            "detected_abnormalities": abnormalities,
            "possible_risks": risks,
            "recommendations": recommendations,
            "contact_flight_surgeon": contact,
        }
    )
    return sanitized, list(dict.fromkeys(warnings))
