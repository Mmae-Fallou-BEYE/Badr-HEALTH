"""Typed exceptions raised by the BioMistral AI module."""

from __future__ import annotations

from typing import Any


class BiomistralError(Exception):
    """Base exception with a stable machine-readable error code."""

    code = "BIOMISTRAL_ERROR"

    def __init__(self, message: str, *, details: Any | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.details is not None:
            payload["details"] = self.details
        return {"error": payload}


class ConfigurationError(BiomistralError):
    code = "CONFIGURATION_ERROR"


class OllamaUnavailableError(BiomistralError):
    code = "AI_UNAVAILABLE"


class ModelNotFoundError(BiomistralError):
    code = "MODEL_NOT_FOUND"


class ModelTimeoutError(BiomistralError):
    code = "TIMEOUT"


class InputValidationError(BiomistralError):
    code = "INVALID_INPUT"


class ReportValidationError(BiomistralError):
    code = "INVALID_MODEL_OUTPUT"


class InvalidModelOutputError(BiomistralError):
    code = "INVALID_MODEL_OUTPUT"


class GroundingError(BiomistralError):
    code = "GROUNDING_FAILED"


class AnalysisError(BiomistralError):
    code = "ANALYSIS_ERROR"
