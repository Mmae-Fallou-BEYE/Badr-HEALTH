"""Orchestration of the BioMistral medical analysis pipeline."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any

from pydantic import ValidationError as PydanticValidationError

from .client import OllamaClient
from .config import Settings, get_settings
from .exceptions import (
    BiomistralError,
    ConfigurationError,
    InputValidationError,
    InvalidModelOutputError,
    ReportValidationError,
)
from .grounding import check_grounding, sanitize_report
from .prompts import (
    PROMPT_VERSION,
    SYSTEM_PROMPT,
    build_repair_prompt,
    build_user_prompt,
)
from .red_flags import FlagSeverity, RedFlagReport, evaluate_red_flags
from .report import build_report
from .schemas import AstronautData, MedicalReport, REPORT_JSON_SCHEMA
from .validator import validate_report


@dataclass
class AnalysisResult:
    report: MedicalReport
    model_info: dict[str, Any]
    attempts: int
    warnings: list[str] = field(default_factory=list)
    needs_review: bool = False
    input_hash: str = ""
    missing_fields: list[str] = field(default_factory=list)
    prompt_version: str = PROMPT_VERSION
    red_flags: RedFlagReport | None = None

    def to_dict(self) -> dict[str, Any]:
        return build_report(
            report=self.report,
            model_info=self.model_info,
            attempts=self.attempts,
            warnings=self.warnings,
            needs_review=self.needs_review,
            input_hash=self.input_hash,
            missing_fields=self.missing_fields,
            prompt_version=self.prompt_version,
            red_flags=self.red_flags,
        )


def _dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in items if item))


def _input_hash(canonical: Mapping[str, Any]) -> str:
    payload = json.dumps(
        canonical,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class Analyzer:
    """Run the complete validation, generation and grounding pipeline."""

    def __init__(
        self,
        *,
        client: OllamaClient | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.client = client or OllamaClient(settings=self.settings)

    def analyze(
        self,
        payload: Mapping[str, Any] | AstronautData,
        *,
        max_attempts: int | None = None,
    ) -> AnalysisResult:
        data = self._validate_input(payload)
        canonical = data.to_canonical_dict()
        missing_fields = data.missing_core_fields()
        attempts_limit = (
            self.settings.max_attempts if max_attempts is None else max_attempts
        )
        if not 1 <= attempts_limit <= 5:
            raise ConfigurationError("max_attempts must be between 1 and 5.")

        red_flags = evaluate_red_flags(data)
        red_flag_warnings = self._red_flag_warnings(red_flags)

        ensure_model = getattr(self.client, "ensure_model_available", None)
        if callable(ensure_model):
            ensure_model()

        user_prompt = build_user_prompt(canonical, missing_fields, red_flags)
        last_errors: list[str] = []
        last_validation = None
        last_grounding = None
        warnings: list[str] = []

        for attempt in range(1, attempts_limit + 1):
            feedback = None
            if attempt > 1:
                feedback = build_repair_prompt(last_errors)

            raw = self.client.chat_structured(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                schema=REPORT_JSON_SCHEMA,
                feedback=feedback,
            )

            try:
                validation = validate_report(raw)
            except ReportValidationError as exc:
                last_errors = [str(exc)]
                continue

            last_validation = validation
            grounding = check_grounding(validation.report, canonical)
            last_grounding = grounding
            warnings = _dedupe(
                list(validation.warnings) + list(grounding.warnings)
            )

            if not grounding.violations:
                return self._build_result(
                    validation.report,
                    canonical,
                    missing_fields,
                    attempt,
                    _dedupe(warnings + red_flag_warnings),
                    needs_review=red_flags.highest_severity
                    == FlagSeverity.CRITICAL,
                    red_flags=red_flags,
                )

            last_errors = list(grounding.violations)

        if last_validation is None or last_grounding is None:
            raise InvalidModelOutputError(
                "BioMistral did not produce a structurally valid report after "
                "the allowed attempts.",
                details={"attempts": attempts_limit, "errors": last_errors},
            )

        sanitized, sanitize_warnings = sanitize_report(
            last_grounding.report, canonical
        )
        warnings = _dedupe(
            warnings
            + last_errors
            + list(last_grounding.warnings)
            + sanitize_warnings
            + red_flag_warnings
        )
        return self._build_result(
            sanitized,
            canonical,
            missing_fields,
            attempts_limit,
            warnings,
            needs_review=True,
            red_flags=red_flags,
        )

    def healthcheck(self) -> dict[str, Any]:
        checker = getattr(self.client, "healthcheck", None)
        if callable(checker):
            return checker()
        return {
            "ok": True,
            "model": getattr(self.client, "model", self.settings.model),
            "model_available": True,
        }

    def close(self) -> None:
        closer = getattr(self.client, "close", None)
        if callable(closer):
            closer()

    def _validate_input(
        self, payload: Mapping[str, Any] | AstronautData
    ) -> AstronautData:
        if isinstance(payload, AstronautData):
            return payload
        if not isinstance(payload, Mapping):
            raise InputValidationError("Input must be a JSON object.")
        try:
            return AstronautData.model_validate(dict(payload))
        except PydanticValidationError as exc:
            details = []
            for error in exc.errors(include_url=False):
                location = ".".join(str(part) for part in error["loc"])
                details.append(
                    {
                        "field": location,
                        "message": error["msg"],
                        "type": error["type"],
                    }
                )
            raise InputValidationError(
                "Invalid astronaut data.", details=details
            ) from exc

    def _build_result(
        self,
        report: MedicalReport,
        canonical: Mapping[str, Any],
        missing_fields: list[str],
        attempts: int,
        warnings: list[str],
        *,
        needs_review: bool,
        red_flags: RedFlagReport,
    ) -> AnalysisResult:
        return AnalysisResult(
            report=report,
            model_info=self._model_info(),
            attempts=attempts,
            warnings=_dedupe(warnings),
            needs_review=needs_review,
            input_hash=_input_hash(canonical),
            missing_fields=missing_fields,
            red_flags=red_flags,
        )

    @staticmethod
    def _red_flag_warnings(red_flags: RedFlagReport) -> list[str]:
        if red_flags.highest_severity != FlagSeverity.CRITICAL:
            return []
        codes = ", ".join(
            flag.code
            for flag in red_flags.flags
            if flag.severity == FlagSeverity.CRITICAL
        )
        return [
            "Critical deterministic red flag(s) detected: "
            f"{codes}. Flight surgeon review required."
        ]

    def _model_info(self) -> dict[str, Any]:
        getter = getattr(self.client, "model_info", None)
        if callable(getter):
            try:
                info = getter()
            except Exception:  # noqa: BLE001 - metadata must not fail analysis
                info = None
            if isinstance(info, Mapping):
                return dict(info)
        return {
            "name": getattr(self.client, "model", self.settings.model),
            "digest": None,
        }


def analyze_astronaut_data(
    payload: Mapping[str, Any],
    *,
    client: OllamaClient | None = None,
    settings: Settings | None = None,
    max_attempts: int | None = None,
) -> dict[str, Any]:
    """Convenience API returning the complete JSON envelope."""
    analyzer = Analyzer(client=client, settings=settings)
    try:
        return analyzer.analyze(payload, max_attempts=max_attempts).to_dict()
    finally:
        # Only close clients created by this convenience function.
        if client is None:
            analyzer.close()
