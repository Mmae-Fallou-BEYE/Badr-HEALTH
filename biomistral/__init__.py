"""BioMistral medical analysis module for long-duration space missions."""

from __future__ import annotations

from .analyzer import AnalysisResult, Analyzer, analyze_astronaut_data
from .client import OllamaClient
from .config import Settings, get_settings
from .exceptions import (
    AnalysisError,
    BiomistralError,
    ConfigurationError,
    GroundingError,
    InputValidationError,
    InvalidModelOutputError,
    ModelNotFoundError,
    ModelTimeoutError,
    OllamaUnavailableError,
    ReportValidationError,
)
from .red_flags import (
    FlagSeverity,
    RedFlag,
    RedFlagReport,
    RedFlagThresholds,
    evaluate_red_flags,
)
from .adapter import (
    IAAdapterConfig,
    IAAdapterResult,
    adapt_conversation_to_astronautdata,
    adapt_supabase_to_astronautdata,
)
from .schemas import (
    Abnormality,
    AstronautData,
    BloodPressure,
    ContactFlightSurgeon,
    EvidenceRef,
    FlightSurgeonDecision,
    MedicalReport,
    PossibleRisk,
    REPORT_JSON_SCHEMA,
    REPORT_SCHEMA_VERSION,
    RiskLevel,
    UncertaintyLevel,
)

__version__ = "0.2.0"

__all__ = [
    "Abnormality",
    "AnalysisError",
    "AnalysisResult",
    "Analyzer",
    "AstronautData",
    "BiomistralError",
    "BloodPressure",
    "ConfigurationError",
    "ContactFlightSurgeon",
    "EvidenceRef",
    "FlightSurgeonDecision",
    "FlagSeverity",
    "GroundingError",
    "InputValidationError",
    "InvalidModelOutputError",
    "MedicalReport",
    "ModelNotFoundError",
    "ModelTimeoutError",
    "OllamaClient",
    "OllamaUnavailableError",
    "PossibleRisk",
    "REPORT_JSON_SCHEMA",
    "REPORT_SCHEMA_VERSION",
    "RedFlag",
    "RedFlagReport",
    "RedFlagThresholds",
    "ReportValidationError",
    "RiskLevel",
    "Settings",
    "UncertaintyLevel",
    "analyze_astronaut_data",
    "evaluate_red_flags",
    "get_settings",
    "adapt_supabase_to_astronautdata",
    "adapt_conversation_to_astronautdata",
    "IAAdapterConfig",
    "IAAdapterResult",
]
