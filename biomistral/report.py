"""Final report envelope and JSON serialization."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import datetime, timezone
from typing import Any

from .red_flags import RedFlagReport
from .schemas import REPORT_SCHEMA_VERSION, MedicalReport

DISCLAIMER = (
    "AI-assisted analysis for decision support only. It does not replace a "
    "qualified flight surgeon or medical professional."
)


def _dedupe(items: Sequence[str]) -> list[str]:
    return list(dict.fromkeys(item for item in items if item))


def build_report(
    *,
    report: MedicalReport,
    model_info: Mapping[str, Any],
    attempts: int,
    warnings: Sequence[str],
    needs_review: bool,
    input_hash: str,
    missing_fields: Sequence[str],
    prompt_version: str,
    red_flags: RedFlagReport | None = None,
) -> dict[str, Any]:
    """Build the stable envelope consumed by the interface."""
    return {
        "schema_version": REPORT_SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "model": {
            "name": model_info.get("name"),
            "digest": model_info.get("digest"),
            "family": model_info.get("family"),
            "quantization": model_info.get("quantization"),
            "prompt_version": prompt_version,
        },
        "input": {
            "hash": input_hash,
            "missing_fields": list(missing_fields),
        },
        "red_flags": (
            red_flags.model_dump(mode="json")
            if red_flags is not None
            else None
        ),
        "report": report.model_dump(mode="json"),
        "validation": {
            "attempts": attempts,
            "warnings": _dedupe(warnings),
            "needs_review": needs_review,
        },
        "disclaimer": DISCLAIMER,
    }
